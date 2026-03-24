// Robust randomized assignment strategy (main)
function assignRolesRandomized(studentNames, roleNames) {
	// Constraints:
	// 1. All students are assigned each role exactly once across all projects.
	// 2. No student is assigned two roles for a single project.
	// 3. No pair of students is matched in the first two roles more than once (order matters).
	// 4. (Ideal) Maximize team member variety.

	const uniqueNames = [...new Set(studentNames.map((name) => name.trim()).filter(Boolean))];
	const uniqueRoles = [...new Set(roleNames.map((role) => role.trim()).filter(Boolean))];
	const numProjects = uniqueNames.length;
	if (uniqueRoles.length < 2) throw new Error("At least 2 unique role names are required.");
	if (uniqueNames.length < uniqueRoles.length) throw new Error(`At least ${uniqueRoles.length} unique student names are required.`);

	// 1. Assign first role in order
	const assignments = [];
	for (let i = 0; i < numProjects; i++) {
		assignments.push({ project: i + 1 });
		assignments[i][uniqueRoles[0]] = uniqueNames[i];
	}

	// 2. Randomly assign second role, fix violations by swaps
	let secondRolePool = shuffleArray(uniqueNames);
	for (let i = 0; i < numProjects; i++) {
		assignments[i][uniqueRoles[1]] = secondRolePool[i];
	}
	// Fix violations for first two roles (unordered pairs)
	const firstRole = uniqueRoles[0];
	const secondRole = uniqueRoles[1];
	const usedPairs = new Set();
	let maxSwaps = numProjects * 4;
	let swaps = 0;
	let changed = true;
	function unorderedPairKey(a, b) {
		return a < b ? `${a}|${b}` : `${b}|${a}`;
	}
	while (changed && swaps < maxSwaps) {
		changed = false;
		usedPairs.clear();
		for (let i = 0; i < numProjects; i++) {
			const a = assignments[i][firstRole];
			const b = assignments[i][secondRole];
			if (a === b || usedPairs.has(unorderedPairKey(a, b))) {
				// Find a row to swap with
				for (let j = 0; j < numProjects; j++) {
					if (i === j) continue;
					const b2 = assignments[j][secondRole];
					if (b2 !== a && b2 !== assignments[j][firstRole] && !usedPairs.has(unorderedPairKey(a, b2)) && !usedPairs.has(unorderedPairKey(assignments[j][firstRole], b))) {
						// Swap second role between i and j
						assignments[i][secondRole] = b2;
						assignments[j][secondRole] = b;
						swaps++;
						changed = true;
						break;
					}
				}
			}
			usedPairs.add(unorderedPairKey(a, assignments[i][secondRole]));
		}
	}
	console.log(`[Randomized Assignment] Swaps for first two roles: ${swaps}`);

	// 3. Randomly assign remaining roles, one at a time, fixing row violations by swaps
	for (let r = 2; r < uniqueRoles.length; r++) {
		let pool = shuffleArray(uniqueNames);
		for (let i = 0; i < numProjects; i++) {
			assignments[i][uniqueRoles[r]] = pool[i];
		}
		// Fix row violations (no student twice in a row)
		let maxSwaps = numProjects * 4;
		let swaps = 0;
		let changed = true;
		while (changed && swaps < maxSwaps) {
			changed = false;
			for (let i = 0; i < numProjects; i++) {
				const row = assignments[i];
				const seen = new Set();
				let dup = null;
				for (let k = 0; k <= r; k++) {
					const s = row[uniqueRoles[k]];
					if (seen.has(s)) { dup = s; break; }
					seen.add(s);
				}
				if (dup) {
					// Find a row to swap with
					for (let j = 0; j < numProjects; j++) {
						if (i === j) continue;
						const s2 = assignments[j][uniqueRoles[r]];
						// Check if s2 is already in row i, and dup is already in row j (for roles up to r)
						let s2InRowI = false;
						let dupInRowJ = false;
						for (let k = 0; k < r; k++) {
							if (assignments[i][uniqueRoles[k]] === s2) s2InRowI = true;
							if (assignments[j][uniqueRoles[k]] === dup) dupInRowJ = true;
						}
						if (!seen.has(s2) && !s2InRowI && !dupInRowJ) {
							// Swap
							assignments[i][uniqueRoles[r]] = s2;
							assignments[j][uniqueRoles[r]] = dup;
							swaps++;
							changed = true;
							break;
						}
					}
				}
			}
		}
		console.log(`[Randomized Assignment] Swaps for role '${uniqueRoles[r]}': ${swaps}`);
	}

	// 4. (Optional) Post-process to break up large overlaps in teams
	// Try up to 1000 swaps to break up groups of 3+ in common
	const maxOverlapSwaps = 1000;
	let overlapSwaps = 0;
	function countOverlap(a, b) {
		let count = 0;
		for (const role of uniqueRoles) {
			if (a[role] === b[role]) count++;
		}
		return count;
	}
	let foundOverlap = true;
	while (foundOverlap && overlapSwaps < maxOverlapSwaps) {
		foundOverlap = false;
		for (let i = 0; i < numProjects; i++) {
			for (let j = i + 1; j < numProjects; j++) {
				if (countOverlap(assignments[i], assignments[j]) >= 3) {
					// Try to swap a role >= 2
					for (let r = 2; r < uniqueRoles.length; r++) {
						const s1 = assignments[i][uniqueRoles[r]];
						const s2 = assignments[j][uniqueRoles[r]];
						if (s1 !== s2 && !Object.values(assignments[i]).includes(s2) && !Object.values(assignments[j]).includes(s1)) {
							assignments[i][uniqueRoles[r]] = s2;
							assignments[j][uniqueRoles[r]] = s1;
							overlapSwaps++;
							foundOverlap = true;
							break;
						}
					}
				}
			}
		}
	}
	if (overlapSwaps > 0) {
		console.log(`[Randomized Assignment] Overlap-breaking swaps: ${overlapSwaps}`);
	}

	validateAssignments(assignments, uniqueNames, uniqueRoles);
	return assignments;
}
// Assignment Constraints (for all strategies):
// 1. All students are assigned each role exactly once across all projects.
// 2. No student is assigned two roles for a single project.
// 3. No pair of students is matched in the first two roles (e.g., Client/Lead) more than once (order matters: A/B and B/A are different).
// 4. (Ideal, not mandatory) Maximize team member variety so students work with as many others as possible.

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

function initAssignmentForm() {
	const form = document.getElementById("assignmentForm");
	const roleTextarea = document.getElementById("projectRoles");
	const studentTextarea = document.getElementById("studentNames");
	const output = document.getElementById("assignmentResults");

	if (!form || !roleTextarea || !studentTextarea || !output) {
		return;
	}

	const strategySelect = document.getElementById("assignmentStrategy");
	form.addEventListener("submit", (event) => {
		event.preventDefault();

		try {
			const roles = parseRoleNames(roleTextarea.value);
			const students = parseStudentNames(studentTextarea.value);
			const strategy = strategySelect ? strategySelect.value : "randomized";
			let assignments;
			if (strategy === "sequential") {
				assignments = assignRolesSequential(students, roles);
			} else if (strategy === "experimental-pair-minimizing") {
				assignments = assignRolesForFinalProjects(students, roles);
			} else {
				assignments = assignRolesRandomized(students, roles);
			}
			output.innerHTML = "";
			output.append(formatAssignmentsTable(assignments, roles));
		} catch (error) {
			output.textContent = error.message;
		}
	});
	// Original sequential assignment (cyclic, simple)
	function assignRolesSequential(studentNames, roleNames) {
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

		const randomizedStudents = shuffleArray(uniqueNames);
		const assignments = randomizedStudents.map((_, projectIndex) => {
			const project = { project: projectIndex + 1 };

			uniqueRoles.forEach((role, roleIndex) => {
				const studentIndex = (projectIndex + roleIndex) % randomizedStudents.length;
				project[role] = randomizedStudents[studentIndex];
			});

			return project;
		});

		validateAssignments(assignments, randomizedStudents, uniqueRoles);
		return assignments;
	}
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

// Greedy pair-minimizing assignment for final projects


function assignRolesForFinalProjects(studentNames, roleNames, options = {}) {
	// See constraints above.
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

	const numProjects = uniqueNames.length;
	// Track which students have been assigned to which roles
	const studentRoleCounts = new Map(); // Map student -> Set of roles
	uniqueNames.forEach((name) => studentRoleCounts.set(name, new Set()));
	// Track first-two-role pairs (ordered, e.g., 'Client:Alice|Lead:Bob')
	const firstRole = uniqueRoles[0];
	const secondRole = uniqueRoles[1];
	const firstTwoRolePairs = new Set();

	const assignments = [];
	let availableStudents = [...uniqueNames];
	for (let projectIndex = 0; projectIndex < numProjects; projectIndex++) {
		let bestAssignment = null;
		let bestScore = -1;
		let bestOrder = null;
		let firstValidAssignment = null;
		let firstValidOrder = null;
		const maxAttempts = 300;
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			let order = shuffleArray(availableStudents);
			const assignment = { project: projectIndex + 1 };
			let valid = true;
			// Assign roles, ensuring each student is only assigned to each role once (constraint 1)
			const usedThisProject = new Set();
			for (let r = 0; r < uniqueRoles.length; r++) {
				const student = order[r % order.length];
				if (studentRoleCounts.get(student).has(uniqueRoles[r]) || usedThisProject.has(student)) {
					valid = false;
					break;
				}
				assignment[uniqueRoles[r]] = student;
				usedThisProject.add(student);
			}
			if (!valid) continue;
			// Check first-two-role pair constraint (constraint 3)
			const pairKey = `${firstRole}:${assignment[firstRole]}|${secondRole}:${assignment[secondRole]}`;
			if (firstTwoRolePairs.has(pairKey)) continue;
			// Save the first valid assignment in case we can't maximize variety
			if (!firstValidAssignment) {
				firstValidAssignment = Object.assign({}, assignment);
				firstValidOrder = [...order];
			}
			// Score: maximize team variety (constraint 4, not mandatory)
			// Count how many new student pairs are introduced in this project
			let newPairs = 0;
			for (let i = 0; i < uniqueRoles.length; i++) {
				for (let j = i + 1; j < uniqueRoles.length; j++) {
					const a = assignment[uniqueRoles[i]];
					const b = assignment[uniqueRoles[j]];
					if (a !== b) {
						// Count as new if these two have not been together in any previous project
						let seen = false;
						for (const prev of assignments) {
							const prevA = prev[uniqueRoles[i]];
							const prevB = prev[uniqueRoles[j]];
							if ((prevA === a && prevB === b) || (prevA === b && prevB === a)) {
								seen = true;
								break;
							}
						}
						if (!seen) newPairs++;
					}
				}
			}
			if (newPairs > bestScore) {
				bestScore = newPairs;
				bestAssignment = Object.assign({}, assignment);
				bestOrder = [...order];
				if (newPairs === (uniqueRoles.length * (uniqueRoles.length - 1)) / 2) break;
			}
		}
		// Use the best assignment found, or fallback to the first valid one
		const finalAssignment = bestAssignment || firstValidAssignment;
		const finalOrder = bestOrder || firstValidOrder;
		if (!finalAssignment) {
			throw new Error("Unable to find a valid assignment that meets all constraints. Try fewer projects or roles.");
		}
		// Mark roles for each student
		for (let r = 0; r < uniqueRoles.length; r++) {
			studentRoleCounts.get(finalAssignment[uniqueRoles[r]]).add(uniqueRoles[r]);
		}
		// Mark first-two-role pair as used
		const pairKey = `${firstRole}:${finalAssignment[firstRole]}|${secondRole}:${finalAssignment[secondRole]}`;
		firstTwoRolePairs.add(pairKey);
		assignments.push(finalAssignment);
		availableStudents = finalOrder.slice(1).concat(finalOrder[0]);
	}

	validateAssignments(assignments, uniqueNames, uniqueRoles);
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
	wrapper.append(createCopyHtmlButton(table), table);
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
