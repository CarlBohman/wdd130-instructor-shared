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

function initAssignmentForm() {
	const form = document.getElementById("assignmentForm");
	const roleTextarea = document.getElementById("projectRoles");
	const studentTextarea = document.getElementById("studentNames");
	const output = document.getElementById("assignmentResults");

	if (!form || !roleTextarea || !studentTextarea || !output) {
		return;
	}

	form.addEventListener("submit", (event) => {
		event.preventDefault();

		try {
			const roles = parseRoleNames(roleTextarea.value);
			const students = parseStudentNames(studentTextarea.value);
			const assignments = assignRolesForFinalProjects(students, roles);
			output.innerHTML = "";
			output.append(formatAssignmentsTable(assignments, roles));
		} catch (error) {
			output.textContent = error.message;
		}
	});
}

document.addEventListener("DOMContentLoaded", initAssignmentForm);

function assignRolesForFinalProjects(studentNames, roleNames) {
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

function validateAssignments(assignments, studentNames, roleNames) {
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
			if (usedNames.has(student)) {
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

function formatAssignmentsTable(assignments, roleNames) {
	const wrapper = document.createElement("div");
	const table = document.createElement("table");
	const thead = document.createElement("thead");
	const tbody = document.createElement("tbody");
	const headerRow = document.createElement("tr");
	const columns = ["Project", ...roleNames];
	const sortRole = roleNames.includes("Client") ? "Client" : roleNames[0];
	const sortedAssignments = [...assignments].sort((a, b) =>
		String(a[sortRole]).localeCompare(String(b[sortRole]), undefined, {
			sensitivity: "base",
		})
	);

	columns.forEach((column) => {
		const th = document.createElement("th");
		th.textContent = column;
		headerRow.append(th);
	});

	thead.append(headerRow);

	sortedAssignments.forEach((assignment, index) => {
		const row = document.createElement("tr");
		const values = [index + 1, ...roleNames.map((role) => assignment[role])];

		values.forEach((value) => {
			const td = document.createElement("td");
			td.textContent = value;
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
}
