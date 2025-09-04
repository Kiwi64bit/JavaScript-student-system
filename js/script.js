const state = loadState();

const formElement = document.getElementById("formInput");
const formInputs = formElement.querySelectorAll("input");
const submitBtn = formElement.querySelector(".submit-btn");
const resetBtn = formElement.querySelector(".reset-btn");
const form = {
    element: formElement,
    inputs: formInputs,
    submitBtn: submitBtn,
    resetBtn: resetBtn,
};

const tableElement = document.getElementById("contentTable");
const tBody = tableElement.querySelector("tbody");
const searchInput = document.getElementById("search");
const warningMessage = document.getElementById("emptyTableWarning");
const table = {
    element: tableElement,
    tbody: tBody,
    searchInput: searchInput,
    warningMessage: warningMessage,
};

const patterns = {
    firstName: /^[a-z]+$/i,
    lastName: /^[a-z]+$/i,
    age: /^[1-9][0-9]{0,2}$/,
    email: /[\w\.\-\+\/]+@(gmail|yahoo).(com|org)$/,
    phone: /^(0020|\+20|0)(10|11|12|15)\d{8}$/,
};

function loadState() {
    try {
        const students = JSON.parse(localStorage.getItem("studentsData")) ?? {};
        const currentId = parseInt(localStorage.getItem("lastId") ?? 1, 10);
        return { students, currentId, editingId: null, activeUndoBtn: null, activeDeleteBtn: null };
    } catch {
        // fallback for corrupted JSON
        return { students: {}, currentId: 1, editingId: null, activeUndoBtn: null };
    }
}

function saveState(state) {
    try {
        localStorage.setItem("studentsData", JSON.stringify(state.students));
        localStorage.setItem("lastId", String(state.currentId));
    } catch (e) {
        console.error("Could not save to localStorage", e);
    }
}

function updateWarningMessage(table) {
    table.warningMessage.style.display = table.tbody.children.length === 0 ? "block" : "none";
}

function reloadTableContent(table, content) {
    table.tbody.innerHTML = "";
    for (const id in content) {
        const data = content[id];
        const studentRowElement = createStudentRow(id, data);
        table.tbody.appendChild(studentRowElement);
    }
    updateWarningMessage(table);
}

function highlightRow(row, className, duration = 1500) {
    row.style.setProperty("--highlight-duration", `${duration}ms`);
    row.classList.add(className);
    setTimeout(() => {
        row.classList.remove(className);
        row.style.removeProperty("--highlight-duration");
    }, duration);
}

function setFormSubmitBtnMode(form, mode) {
    if (mode === "edit") {
        form.submitBtn.dataset.action = "edit";
        form.submitBtn.classList.replace("btn-success", "btn-info");
        form.submitBtn.textContent = "Edit";
        return;
    }
    if (mode === "add") {
        form.submitBtn.dataset.action = "add";
        form.submitBtn.classList.replace("btn-info", "btn-success");
        form.submitBtn.textContent = "Add";
        return;
    }
}

function addStudent(table, id, data) {
    state.students[id] = data;
    insertOrUpdateRow(table, id, data);
    saveState(state);
}

function updateStudentRow(table, id, newData) {
    state.students[id] = newData;
    insertOrUpdateRow(table, id, newData, true);
    saveState(state);
}

function insertOrUpdateRow(table, id, data, highlight = false) {
    const existingRow = table.tbody.querySelector(`tr[data-id="${id}"]`);
    const newRow = createStudentRow(id, data);

    if (existingRow) {
        table.tbody.replaceChild(newRow, existingRow);
        if (highlight) {
            highlightRow(newRow, "highlight-row", 3000);
        }
    } else {
        table.tbody.appendChild(newRow);
    }

    updateWarningMessage(table);
}

function createStudentRow(id, data) {
    const tr = document.createElement("tr");
    tr.dataset.id = id;
    tr.innerHTML = `
        <th scope="row">${id}</th>
        <td>${data.firstName}</td>
        <td>${data.lastName}</td>
        <td>${data.age}</td>
        <td>${data.email}</td>
        <td>${data.phone}</td>
        <td>
            <button class="btn btn-info text-light" data-action="edit">Edit</button>
            <button class="btn btn-danger text-light" data-action="delete">Delete</button>
        </td>`;
    return tr;
}

function deleteStudent(table, id, rowElement) {
    if (!confirm("Are you sure you want to delete this student?")) return;
    delete state.students[id];
    rowElement.remove();
    saveState(state);
    updateWarningMessage(table);
}

function startEdit(form, id) {
    resetForm(form);
    const oldUndoBtn = state.activeUndoBtn;
    const oldDeleteBtn = state.activeDeleteBtn;
    const rowElement = table.tbody.querySelector(`tr[data-id="${id}"]`);
    const editBtn = rowElement.querySelector(`button[data-action="edit"]`);
    state.activeDeleteBtn = rowElement.querySelector(`button[data-action="delete"]`);

    state.editingId = id;
    const data = state.students[id];
    for (const input of form.inputs) {
        input.value = data[input.name] ?? "";
    }

    state.activeUndoBtn = editBtn;
    setFormSubmitBtnMode(form, "edit");
    setButtonMode(oldUndoBtn, "edit");
    setButtonMode(state.activeUndoBtn, "undo");
    if (oldDeleteBtn) oldDeleteBtn.disabled = false;
    if (state.activeDeleteBtn) state.activeDeleteBtn.disabled = true;
    form.resetBtn.style.display = "block";
}

function setButtonMode(btn = null, mode) {
    if (!btn) return;

    const config = {
        edit: { from: "btn-primary", to: "btn-info", text: "Edit" },
        undo: { from: "btn-info", to: "btn-primary", text: "Undo" },
    };

    const { from, to, text } = config[mode];
    btn.classList.replace(from, to);
    btn.textContent = text;
    btn.dataset.action = mode;
}

function undoEdit(form) {
    resetForm(form);
    setFormSubmitBtnMode(form, "add");
    setButtonMode(state.activeUndoBtn, "edit");
    state.editingId = null;
    state.activeUndoBtn = null;
    state.activeDeleteBtn.disabled = false;
}

function validateInput(input) {
    const errorField = input.parentElement.nextElementSibling;
    const value = input.value.trim();
    const isEmpty = !value;
    const isValid = patterns[input.name].test(value);

    if (isEmpty) {
        showError(input, errorField, "This field is required!");
        return false;
    }

    if (!isValid) {
        showError(input, errorField, "Invalid input!");
        return false;
    }

    showSuccess(input, errorField);
    return true;
}

function showError(input, errorField, message) {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
    errorField.style.display = "block";
    errorField.textContent = message;
}

function showSuccess(input, errorField) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
    errorField.style.display = "none";
}

function validateInputs(inputs) {
    const data = {};
    let isValid = true;
    for (const input of inputs) {
        const isInputValid = validateInput(input);
        isValid = isValid && isInputValid;
        data[input.name] = input.value.trim();
    }
    return isValid ? data : null;
}

function resetForm(form) {
    for (const input of form.inputs) {
        input.blur();
        input.classList.remove("is-valid", "is-invalid");
        const errorField = form.element.querySelector(`[data-error-id=${input.name}]`);
        errorField.style.display = "none";
    }
    form.element.reset();
    form.resetBtn.style.display = "none";
}

function submitData(form, table) {
    const data = validateInputs(form.inputs);
    if (!data) return;

    if (form.submitBtn.dataset.action === "add") {
        addStudent(table, state.currentId++, data);
        resetForm(form);
        return;
    }
    if (form.submitBtn.dataset.action === "edit") {
        if (!confirm("Are you sure you want to edit this student?")) return;
        state.students[state.editingId] = data;
        updateStudentRow(table, state.editingId, data);
        saveState(state);
        setFormSubmitBtnMode(form, "add");
        resetForm(form);
        return;
    }
}

function search(content, query) {
    const searchResult = {};
    query = query.toLowerCase().trim();
    if (!query) return content;
    for (const id in content) {
        const data = content[id];
        if (String(id).includes(query)) {
            searchResult[id] = data;
            continue;
        }
        for (const key in data) {
            const value = data[key];
            if (String(value).toLowerCase().includes(query)) {
                searchResult[id] = data;
                break;
            }
        }
    }
    return searchResult;
}

reloadTableContent(table, state.students);

form.element.addEventListener("submit", (event) => {
    event.preventDefault();
    submitData(form, table);
});

form.element.addEventListener("input", () => {
    if (form.submitBtn.dataset.action === "add") {
        const hasValue = Array.from(form.inputs).some((input) => input.value);
        form.resetBtn.style.display = hasValue ? "block" : "none";
    }
});

form.resetBtn.addEventListener("click", () => {
    undoEdit(form);
});

for (const input of form.inputs) {
    input.addEventListener("blur", () => {
        validateInput(input);
    });
}

table.searchInput.addEventListener("input", () => {
    const query = table.searchInput.value;
    const results = search(state.students, query);
    reloadTableContent(table, results);
});

table.tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const row = btn.closest("tr");
    const id = row.dataset.id;

    if (btn.dataset.action === "delete") {
        deleteStudent(table, id, row);
        return;
    }
    if (btn.dataset.action === "edit") {
        startEdit(form, id);
        return;
    }
    if (btn.dataset.action === "undo") {
        undoEdit(form);
        return;
    }
});
