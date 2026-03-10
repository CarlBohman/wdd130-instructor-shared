const PROJECT_ROLES = [
	"Client",
	"Lead Developer",
	"Junior Developer 1",
	"Junior Developer 2",
];

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

function createFinalAssignmentForm(target = document.body) {
	const wrapper = document.createElement("section");
	const form = document.createElement("form");
	const heading = document.createElement("h2");
	const instructions = document.createElement("p");
	const label = document.createElement("label");
	const textarea = document.createElement("textarea");
	const submitButton = document.createElement("button");
	const output = document.createElement("div");

	heading.textContent = "Final Project Role Randomizer";
	instructions.textContent = "Enter one student name per line.";
	label.setAttribute("for", "studentNames");
	label.textContent = "Student Names";
	textarea.id = "studentNames";
	textarea.name = "studentNames";
	textarea.rows = 10;
	textarea.required = true;
	textarea.placeholder = "Jane Doe\nJohn Smith\n...";
	submitButton.type = "submit";
	submitButton.textContent = "Assign Roles";
	output.id = "assignmentResults";

	form.append(heading, instructions, label, textarea, submitButton);
	wrapper.append(form, output);
	target.append(wrapper);

	form.addEventListener("submit", (event) => {
		event.preventDefault();

		try {
			const students = parseStudentNames(textarea.value);
			const assignments = assignRolesForFinalProjects(students);
			output.innerHTML = "";
			output.append(formatAssignmentsTable(assignments));
		} catch (error) {
			output.textContent = error.message;
		}
	});

	return { wrapper, form, textarea, submitButton, output };
}

function assignRolesForFinalProjects(studentNames) {
	if (!Array.isArray(studentNames)) {
		throw new Error("Student list must be an array of names.");
	}

	const uniqueNames = [...new Set(studentNames.map((name) => name.trim()).filter(Boolean))];

	if (uniqueNames.length < PROJECT_ROLES.length) {
		throw new Error("At least 4 unique student names are required.");
	}

	const randomizedStudents = shuffleArray(uniqueNames);
	const assignments = randomizedStudents.map((_, projectIndex) => {
		const project = { project: projectIndex + 1 };

		PROJECT_ROLES.forEach((role, roleIndex) => {
			const studentIndex = (projectIndex + roleIndex) % randomizedStudents.length;
			project[role] = randomizedStudents[studentIndex];
		});

		return project;
	});

	validateAssignments(assignments, randomizedStudents);
	return assignments;
}

function validateAssignments(assignments, studentNames) {
	const roleCountsByStudent = new Map(
		studentNames.map((name) => [
			name,
			PROJECT_ROLES.reduce((counts, role) => {
				counts[role] = 0;
				return counts;
			}, {}),
		])
	);

	const clientToLead = new Map();
	assignments.forEach((assignment) => {
		clientToLead.set(assignment["Client"], assignment["Lead Developer"]);
	});

	clientToLead.forEach((lead, client) => {
		if (clientToLead.get(lead) === client) {
			throw new Error(
				`Invalid reciprocal pair: ${client} and ${lead} cannot be each other's Client/Lead Developer.`
			);
		}
	});

	assignments.forEach((assignment) => {
		const usedNames = new Set();

		PROJECT_ROLES.forEach((role) => {
			const student = assignment[role];
			if (usedNames.has(student)) {
				throw new Error(`A student cannot hold two roles in project ${assignment.project}.`);
			}

			usedNames.add(student);
			roleCountsByStudent.get(student)[role] += 1;
		});
	});

	roleCountsByStudent.forEach((roleCounts, student) => {
		PROJECT_ROLES.forEach((role) => {
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

function formatAssignmentsTable(assignments) {
	const wrapper = document.createElement("div");
	const table = document.createElement("table");
	const thead = document.createElement("thead");
	const tbody = document.createElement("tbody");
	const headerRow = document.createElement("tr");
	const columns = ["Project", ...PROJECT_ROLES];
	const sortedAssignments = [...assignments].sort((a, b) =>
		String(a["Client"]).localeCompare(String(b["Client"]), undefined, {
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
		const values = [
			index + 1,
			assignment["Client"],
			assignment["Lead Developer"],
			assignment["Junior Developer 1"],
			assignment["Junior Developer 2"],
		];

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
	window.createFinalAssignmentForm = createFinalAssignmentForm;
	window.assignRolesForFinalProjects = assignRolesForFinalProjects;
	window.validateAssignments = validateAssignments;
	window.formatAssignmentsTable = formatAssignmentsTable;
}
