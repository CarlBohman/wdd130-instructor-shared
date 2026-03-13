const DEFAULT_PROJECT_ROLES = ["Client", "Lead Developer", "Junior Developer 1", "Junior Developer 2"];

function shuffleArray(values) {
	const array = [...values];
	for (let i = array.length - 1; i > 0; i -= 1) {
		const randomIndex = Math.floor(Math.random() * (i + 1));
		[array[i], array[randomIndex]] = [array[randomIndex], array[i]];
	}
	return array;
}

function parseStudentNames(input) {
	return input
		.split("\n")
		.map((name) => name.trim())
		.filter(Boolean);
}

function parseRoleNames(input) {
	return input
		.split("\n")
		.map((role) => role.trim())
		.filter(Boolean);
}

function cloneAssignments(assignments, roleNames) {
	return assignments.map((assignment) => {
		const clone = { project: assignment.project };
		roleNames.forEach((role) => {
			clone[role] = assignment[role];
		});
		return clone;
	});
}

function getStudentsFromAssignments(assignments, roleNames) {
	const students = new Set();
	assignments.forEach((assignment) => {
		roleNames.forEach((role) => {
			students.add(assignment[role]);
		});
	});
	return [...students].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function parseAssignmentsTableHtml(tableHtml) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(tableHtml, "text/html");
	const table = doc.querySelector("table");

	if (!table) {
		throw new Error("No <table> element found in pasted HTML.");
	}

	const headerCells = [...table.querySelectorAll("thead th")];
	if (headerCells.length === 0) {
		const firstRow = table.querySelector("tr");
		if (!firstRow) {
			throw new Error("Could not find table headers.");
		}
		firstRow.querySelectorAll("th, td").forEach((cell) => headerCells.push(cell));
	}

	const headers = headerCells.map((cell) => cell.textContent.trim()).filter(Boolean);
	if (headers.length < 3) {
		throw new Error("Table must include Project and at least 2 role columns.");
	}

	if (!/^project$/i.test(headers[0])) {
		throw new Error("The first table column must be Project.");
	}

	const roleNames = headers.slice(1);
	const bodyRows = [...table.querySelectorAll("tbody tr")];
	const rows = bodyRows.length > 0 ? bodyRows : [...table.querySelectorAll("tr")].slice(1);

	if (rows.length === 0) {
		throw new Error("Table has no assignment rows.");
	}

	const assignments = rows.map((row, index) => {
		const cells = [...row.querySelectorAll("th, td")].map((cell) => cell.textContent.trim());
		if (cells.length < headers.length) {
			throw new Error(`Row ${index + 1} does not contain all expected columns.`);
		}

		const assignment = { project: cells[0] || index + 1 };
		roleNames.forEach((role, roleIndex) => {
			assignment[role] = cells[roleIndex + 1];
		});

		return assignment;
	});

	return { assignments, roleNames };
}

function greatestCommonDivisor(a, b) {
	let x = Math.abs(a);
	let y = Math.abs(b);

	while (y !== 0) {
		const temp = y;
		y = x % y;
		x = temp;
	}

	return x;
}

function hasValidRowSpacing(step, studentCount, roleCount) {
	for (let difference = 1; difference < roleCount; difference += 1) {
		if ((difference * step) % studentCount === 0) {
			return false;
		}
	}

	return true;
}

function findMissingStudentForRole(assignments, role, expectedStudents, droppedStudent) {
	const roleStudents = new Set(
		assignments
			.map((assignment) => assignment[role])
			.filter((student) => student && student !== droppedStudent)
	);

	return expectedStudents.find((student) => !roleStudents.has(student)) || null;
}

function getDuplicateStudentsInRow(assignment, roleNames) {
	const counts = new Map();
	roleNames.forEach((role) => {
		const student = assignment[role];
		counts.set(student, (counts.get(student) || 0) + 1);
	});

	return [...counts.entries()].filter(([, count]) => count > 1).map(([student]) => student);
}

function rowHasStudentElsewhere(assignment, roleNames, roleToSkip, student) {
	return roleNames.some((role) => role !== roleToSkip && assignment[role] === student);
}

function createCellKey(project, role) {
	return `${project}::${role}`;
}

function resolveRowConflicts(assignments, roleNames, changeLog, changedCells) {
	const maxPasses = assignments.length * roleNames.length * 4;

	for (let pass = 0; pass < maxPasses; pass += 1) {
		let madeChange = false;

		for (let rowIndex = 0; rowIndex < assignments.length; rowIndex += 1) {
			const row = assignments[rowIndex];
			const duplicates = getDuplicateStudentsInRow(row, roleNames);
			if (duplicates.length === 0) {
				continue;
			}

			for (const duplicateStudent of duplicates) {
				const duplicateRoles = roleNames.filter((role) => row[role] === duplicateStudent);

				for (const role of duplicateRoles) {
					for (let otherRowIndex = 0; otherRowIndex < assignments.length; otherRowIndex += 1) {
						if (otherRowIndex === rowIndex) {
							continue;
						}

						const otherRow = assignments[otherRowIndex];
						const currentStudent = row[role];
						const swapStudent = otherRow[role];

						if (currentStudent === swapStudent) {
							continue;
						}

						if (rowHasStudentElsewhere(row, roleNames, role, swapStudent)) {
							continue;
						}

						if (rowHasStudentElsewhere(otherRow, roleNames, role, currentStudent)) {
							continue;
						}

						row[role] = swapStudent;
						otherRow[role] = currentStudent;
						changedCells.add(createCellKey(row.project, role));
						changedCells.add(createCellKey(otherRow.project, role));
						changeLog.push(
							`Swapped ${role}: Project ${row.project} (${currentStudent} -> ${swapStudent}) with Project ${otherRow.project} (${swapStudent} -> ${currentStudent}).`
						);
						madeChange = true;
						break;
					}

					if (!getDuplicateStudentsInRow(row, roleNames).includes(duplicateStudent)) {
						break;
					}
				}
			}
		}

		if (!madeChange) {
			break;
		}
	}

	const unresolved = assignments.find((assignment) => getDuplicateStudentsInRow(assignment, roleNames).length > 0);
	if (unresolved) {
		throw new Error(
			`Could not fully resolve duplicate roles in Project ${unresolved.project}. Try another generated plan for repair input.`
		);
	}
}

function countPairWarnings(assignments, roleNames) {
	return getPairWarnings(assignments, roleNames).length;
}

function optimizeRepeatedPairs(assignments, roleNames, changeLog, changedCells) {
	let improved = true;
	let guard = 0;

	while (improved && guard < 1000) {
		improved = false;
		guard += 1;
		const baseline = countPairWarnings(assignments, roleNames);

		for (const role of roleNames) {
			for (let rowA = 0; rowA < assignments.length; rowA += 1) {
				for (let rowB = rowA + 1; rowB < assignments.length; rowB += 1) {
					const first = assignments[rowA];
					const second = assignments[rowB];
					const studentA = first[role];
					const studentB = second[role];

					if (studentA === studentB) {
						continue;
					}

					if (rowHasStudentElsewhere(first, roleNames, role, studentB)) {
						continue;
					}

					if (rowHasStudentElsewhere(second, roleNames, role, studentA)) {
						continue;
					}

					first[role] = studentB;
					second[role] = studentA;
					const nextScore = countPairWarnings(assignments, roleNames);

					if (nextScore < baseline) {
						changedCells.add(createCellKey(first.project, role));
						changedCells.add(createCellKey(second.project, role));
						changeLog.push(
							`Optimized pair repeats by swapping ${role} between Project ${first.project} and Project ${second.project}.`
						);
						improved = true;
						break;
					}

					first[role] = studentA;
					second[role] = studentB;
				}

				if (improved) {
					break;
				}
			}

			if (improved) {
				break;
			}
		}
	}
}

function getPairWarnings(assignments, roleNames) {
	const warnings = [];

	for (let i = 0; i < roleNames.length; i += 1) {
		for (let j = i + 1; j < roleNames.length; j += 1) {
			const roleA = roleNames[i];
			const roleB = roleNames[j];
			const seenPairs = new Map();

			assignments.forEach((assignment) => {
				const pairKey = `${assignment[roleA]}|${assignment[roleB]}`;
				const projects = seenPairs.get(pairKey) || [];
				projects.push(assignment.project);
				seenPairs.set(pairKey, projects);
			});

			seenPairs.forEach((projects, pairKey) => {
				if (projects.length > 1) {
					const [studentA, studentB] = pairKey.split("|");
					warnings.push(
						`Pair repeated for ${roleA}/${roleB}: ${studentA} + ${studentB} in projects ${projects.join(", ")}.`
					);
				}
			});
		}
	}

	return warnings;
}

function repairAssignmentsForDroppedStudent(
	originalAssignments,
	roleNames,
	droppedStudent,
	strategy = "minimal"
) {
	const assignments = cloneAssignments(originalAssignments, roleNames);
	const changeLog = [];
	const changedCells = new Set();
	const allowedStrategies = new Set(["minimal", "minimize-pairs", "no-extra-swaps"]);

	if (!allowedStrategies.has(strategy)) {
		throw new Error("Unknown repair strategy.");
	}

	const primaryRole = roleNames.includes("Client") ? "Client" : roleNames[0];
	const rowToRemoveIndex = assignments.findIndex((assignment) => assignment[primaryRole] === droppedStudent);

	if (rowToRemoveIndex === -1) {
		throw new Error(`Could not find a row where ${droppedStudent} is the ${primaryRole}.`);
	}

	const removedRow = assignments.splice(rowToRemoveIndex, 1)[0];
	changeLog.push(`Removed Project ${removedRow.project} (${primaryRole} ${droppedStudent}).`);

	const remainingStudents = getStudentsFromAssignments(assignments, roleNames).filter(
		(student) => student !== droppedStudent
	);

	roleNames.forEach((role) => {
		const droppedRow = assignments.find((assignment) => assignment[role] === droppedStudent);
		if (!droppedRow) {
			return;
		}

		const replacement = findMissingStudentForRole(assignments, role, remainingStudents, droppedStudent);
		if (!replacement) {
			throw new Error(`No replacement available for role ${role}.`);
		}

		droppedRow[role] = replacement;
		changedCells.add(createCellKey(droppedRow.project, role));
		changeLog.push(`Project ${droppedRow.project}: ${role} ${droppedStudent} -> ${replacement}.`);
	});

	if (strategy !== "no-extra-swaps") {
		resolveRowConflicts(assignments, roleNames, changeLog, changedCells);
		if (strategy === "minimize-pairs") {
			optimizeRepeatedPairs(assignments, roleNames, changeLog, changedCells);
		}
	} else {
		changeLog.push("No extra swaps selected: duplicate roles within a project row may remain.");
	}

	validateAssignments(assignments, remainingStudents, roleNames, {
		allowDuplicateRolesInRow: strategy === "no-extra-swaps",
	});
	const warnings = getPairWarnings(assignments, roleNames);
	return { assignments, changeLog, warnings, changedCells };
}

function renderChangeLog(changeLog, warnings) {
	const wrapper = document.createElement("div");
	const heading = document.createElement("h3");
	heading.textContent = "Repair Changes";
	wrapper.append(heading);

	if (changeLog.length > 0) {
		const list = document.createElement("ul");
		list.className = "change-log";
		changeLog.forEach((change) => {
			const item = document.createElement("li");
			item.textContent = change;
			list.append(item);
		});
		wrapper.append(list);
	}

	if (warnings.length > 0) {
		const warningHeading = document.createElement("h3");
		warningHeading.textContent = "Warnings";
		wrapper.append(warningHeading);

		const warningList = document.createElement("ul");
		warningList.className = "change-log";
		warnings.forEach((warning) => {
			const item = document.createElement("li");
			item.textContent = warning;
			warningList.append(item);
		});
		wrapper.append(warningList);
	}

	return wrapper;
}

function populateDroppedStudentSelect(select, students) {
	select.innerHTML = "";

	const placeholderOption = document.createElement("option");
	placeholderOption.value = "";
	placeholderOption.textContent = "Select a dropped student";
	select.append(placeholderOption);

	students.forEach((student) => {
		const option = document.createElement("option");
		option.value = student;
		option.textContent = student;
		select.append(option);
	});
}

function initModeToggle() {
	const modeButtons = [...document.querySelectorAll(".mode-button")];
	if (modeButtons.length === 0) {
		return;
	}

	modeButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const targetId = button.dataset.modeTarget;
			if (!targetId) {
				return;
			}

			modeButtons.forEach((candidate) => {
				const isActive = candidate === button;
				candidate.classList.toggle("is-active", isActive);
				candidate.setAttribute("aria-selected", String(isActive));
			});

			document.querySelectorAll(".tool-mode").forEach((section) => {
				const isActive = section.id === targetId;
				section.classList.toggle("is-active", isActive);
				section.hidden = !isActive;
			});
		});
	});
}

function chooseRoleStep(studentCount, roleCount, requestedGap) {
	if (studentCount <= roleCount) {
		return 1;
	}

	const maxGap = Math.max(0, studentCount - 2);
	const numericGap = Number.isFinite(requestedGap) ? Math.max(0, Math.floor(requestedGap)) : null;
	const preferredGap = numericGap === null ? Math.floor(studentCount / (roleCount * 2)) : Math.min(numericGap, maxGap);

	for (let gapOffset = 0; gapOffset <= maxGap; gapOffset += 1) {
		const gap = preferredGap + gapOffset;
		const step = gap + 1;

		if (step >= studentCount) {
			continue;
		}

		if (greatestCommonDivisor(step, studentCount) !== 1) {
			continue;
		}

		if (!hasValidRowSpacing(step, studentCount, roleCount)) {
			continue;
		}

		return step;
	}

	for (let step = 1; step < studentCount; step += 1) {
		if (hasValidRowSpacing(step, studentCount, roleCount)) {
			return step;
		}
	}

	throw new Error("Unable to choose a valid role gap for this class size and role count.");
}

function initAssignmentForm() {
	const form = document.getElementById("assignmentForm");
	const roleTextarea = document.getElementById("projectRoles");
	const studentTextarea = document.getElementById("studentNames");
	const roleGapInput = document.getElementById("roleGap");
	const output = document.getElementById("assignmentResults");

	if (!form || !roleTextarea || !studentTextarea || !output) {
		return;
	}

	form.addEventListener("submit", (event) => {
		event.preventDefault();

		try {
			const roles = parseRoleNames(roleTextarea.value);
			const students = parseStudentNames(studentTextarea.value);
			const requestedGap = roleGapInput && roleGapInput.value !== "" ? Number(roleGapInput.value) : null;
			const assignments = assignRolesForFinalProjects(students, roles, requestedGap);
			output.innerHTML = "";
			output.append(formatAssignmentsTable(assignments, roles));
		} catch (error) {
			output.textContent = error.message;
		}
	});
}

function initRepairForm() {
	const repairForm = document.getElementById("repairForm");
	const loadButton = document.getElementById("loadRepairTable");
	const tableHtmlTextarea = document.getElementById("existingTableHtml");
	const droppedStudentSelect = document.getElementById("droppedStudent");
	const repairStrategy = document.getElementById("repairStrategy");
	const output = document.getElementById("repairResults");

	if (!repairForm || !loadButton || !tableHtmlTextarea || !droppedStudentSelect || !repairStrategy || !output) {
		return;
	}

	let parsedTableData = null;

	loadButton.addEventListener("click", () => {
		try {
			parsedTableData = parseAssignmentsTableHtml(tableHtmlTextarea.value);
			const students = getStudentsFromAssignments(parsedTableData.assignments, parsedTableData.roleNames);
			populateDroppedStudentSelect(droppedStudentSelect, students);
			output.textContent = `Loaded ${students.length} students and ${parsedTableData.roleNames.length} roles.`;
		} catch (error) {
			output.textContent = error.message;
			parsedTableData = null;
		}
	});

	repairForm.addEventListener("submit", (event) => {
		event.preventDefault();

		try {
			if (!parsedTableData) {
				parsedTableData = parseAssignmentsTableHtml(tableHtmlTextarea.value);
			}

			const droppedStudent = droppedStudentSelect.value;
			if (!droppedStudent) {
				throw new Error("Select the dropped student before repairing assignments.");
			}

			const result = repairAssignmentsForDroppedStudent(
				parsedTableData.assignments,
				parsedTableData.roleNames,
				droppedStudent,
				repairStrategy.value
			);

			output.innerHTML = "";
			output.append(renderChangeLog(result.changeLog, result.warnings));
			output.append(
				formatAssignmentsTable(result.assignments, parsedTableData.roleNames, {
					preserveProjectNumbers: true,
					sortByRole: false,
					changedCells: result.changedCells,
				})
			);
		} catch (error) {
			output.textContent = error.message;
		}
	});
}

document.addEventListener("DOMContentLoaded", initAssignmentForm);
document.addEventListener("DOMContentLoaded", initRepairForm);
document.addEventListener("DOMContentLoaded", initModeToggle);

function assignRolesForFinalProjects(studentNames, roleNames, requestedGap = null) {
	if (!Array.isArray(studentNames)) {
		throw new Error("Student list must be an array of names.");
	}
	if (!Array.isArray(roleNames)) {
		throw new Error("Role list must be an array of role names.");
	}

	const uniqueNames = [...new Set(studentNames.map((name) => name.trim()).filter(Boolean))];
	const uniqueRoles = [...new Set(roleNames.map((role) => role.trim()).filter(Boolean))];

	if (uniqueRoles.length < 2) {
		throw new Error("At least 2 unique role names are required.");
	}

	if (uniqueNames.length < uniqueRoles.length) {
		throw new Error(`At least ${uniqueRoles.length} unique student names are required.`);
	}

	if (requestedGap !== null && (!Number.isFinite(requestedGap) || requestedGap < 0)) {
		throw new Error("Role gap must be a non-negative number.");
	}

	const randomizedStudents = shuffleArray(uniqueNames);
	const roleStep = chooseRoleStep(randomizedStudents.length, uniqueRoles.length, requestedGap);
	const assignments = randomizedStudents.map((_, projectIndex) => {
		const project = { project: projectIndex + 1 };

		uniqueRoles.forEach((role, roleIndex) => {
			const studentIndex =
				(projectIndex + roleIndex * roleStep) % randomizedStudents.length;
			project[role] = randomizedStudents[studentIndex];
		});

		return project;
	});

	assignments.roleStep = roleStep;
	assignments.roleGap = roleStep - 1;
	validateAssignments(assignments, randomizedStudents, uniqueRoles);
	return assignments;
}

function validateAssignments(assignments, studentNames, roleNames, options = {}) {
	const allowDuplicateRolesInRow = options.allowDuplicateRolesInRow === true;
	const roleCountsByStudent = new Map(
		studentNames.map((name) => [
			name,
			roleNames.reduce((counts, role) => {
				counts[role] = 0;
				return counts;
			}, {}),
		])
	);

	assignments.forEach((assignment) => {
		const usedNames = new Set();

		roleNames.forEach((role) => {
			const student = assignment[role];
			if (!allowDuplicateRolesInRow && usedNames.has(student)) {
				throw new Error(`A student cannot hold two roles in project ${assignment.project}.`);
			}

			usedNames.add(student);
			roleCountsByStudent.get(student)[role] += 1;
		});
	});

	roleCountsByStudent.forEach((roleCounts, student) => {
		roleNames.forEach((role) => {
			if (roleCounts[role] !== 1) {
				throw new Error(`${student} was not assigned to ${role} exactly once.`);
			}
		});
	});
}

async function copyTextToClipboard(text) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const helperTextarea = document.createElement("textarea");
	helperTextarea.value = text;
	helperTextarea.setAttribute("readonly", "");
	helperTextarea.style.position = "fixed";
	helperTextarea.style.left = "-9999px";
	document.body.append(helperTextarea);
	helperTextarea.select();
	document.execCommand("copy");
	helperTextarea.remove();
}

function createCopyHtmlButton(table) {
	const actions = document.createElement("div");
	const copyButton = document.createElement("button");
	const status = document.createElement("span");

	actions.className = "result-actions";
	copyButton.type = "button";
	copyButton.className = "copy-html-button";
	copyButton.textContent = "Copy Table HTML";
	status.className = "copy-status";

	copyButton.addEventListener("click", async () => {
		try {
			await copyTextToClipboard(table.outerHTML);
			status.textContent = "Copied.";
		} catch (error) {
			status.textContent = "Unable to copy.";
		}

		window.setTimeout(() => {
			status.textContent = "";
		}, 2000);
	});

	actions.append(copyButton, status);
	return actions;
}

function formatAssignmentsTable(assignments, roleNames, options = {}) {
	const wrapper = document.createElement("div");
	const table = document.createElement("table");
	const thead = document.createElement("thead");
	const tbody = document.createElement("tbody");
	const headerRow = document.createElement("tr");
	const stepSummary = document.createElement("p");
	const columns = ["Project", ...roleNames];
	const preserveProjectNumbers = options.preserveProjectNumbers === true;
	const sortByRole = options.sortByRole !== false;
	const changedCells = options.changedCells || new Set();
	const sortRole = roleNames.includes("Client") ? "Client" : roleNames[0];
	const sortedAssignments = sortByRole
		? [...assignments].sort((a, b) =>
				String(a[sortRole]).localeCompare(String(b[sortRole]), undefined, {
					sensitivity: "base",
				})
			)
		: [...assignments];

	stepSummary.textContent =
		Number.isFinite(assignments.roleGap) && Number.isFinite(assignments.roleStep)
			? `Role gap used: ${assignments.roleGap} (step ${assignments.roleStep}).`
			: "";

	columns.forEach((column) => {
		const th = document.createElement("th");
		th.textContent = column;
		headerRow.append(th);
	});

	thead.append(headerRow);

	sortedAssignments.forEach((assignment, index) => {
		const row = document.createElement("tr");
		const projectValue = preserveProjectNumbers ? assignment.project : index + 1;
		const values = [projectValue, ...roleNames.map((role) => assignment[role])];

		values.forEach((value, valueIndex) => {
			const td = document.createElement("td");
			if (valueIndex > 0) {
				const role = roleNames[valueIndex - 1];
				if (changedCells.has(createCellKey(assignment.project, role))) {
					const strong = document.createElement("strong");
					strong.textContent = value;
					td.append(strong);
				} else {
					td.textContent = value;
				}
			} else {
				td.textContent = value;
			}
			row.append(td);
		});

		tbody.append(row);
	});

	table.append(thead, tbody);
	wrapper.append(stepSummary, createCopyHtmlButton(table), table);
	return wrapper;
}

if (typeof window !== "undefined") {
	window.assignRolesForFinalProjects = assignRolesForFinalProjects;
	window.validateAssignments = validateAssignments;
	window.formatAssignmentsTable = formatAssignmentsTable;
	window.parseRoleNames = parseRoleNames;
	window.parseAssignmentsTableHtml = parseAssignmentsTableHtml;
	window.repairAssignmentsForDroppedStudent = repairAssignmentsForDroppedStudent;
}
