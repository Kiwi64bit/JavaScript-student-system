const form = document.getElementById("formInput");
const formInputs = form.querySelectorAll("input");
const submitBtn = form.querySelector(".submit-btn");
const resetBtn = form.querySelector(".reset-btn");
const searchInput = document.getElementById("search");
const warningMessage = document.getElementById("emptyTableWarning");
const table = document.getElementById("contentTable");
const tableBody = table.querySelector("tbody");
const studentsData = JSON.parse(localStorage.getItem("studentsData")) ?? {};
let currentId = parseInt(localStorage.getItem("currentId") ?? 1);
let currentEditRow = null;
let activeUndoButton = null;
const patterns = {
    firstName: /^[a-z]+$/i,
    lastName: /^[a-z]+$/i,
    age: /^[1-9][0-9]{0,2}$/,
    email: /[\w\.\-\+\/]+@(gmail|yahoo).(com|org)$/,
    phone: /^(0020|\+20|0)(10|11|12|15)\d{8}$/,
};

function isObjectEmpty(obj) {
    if (!obj) return true;
    return Object.keys(obj).length === 0;
}

function updateWarningMessage(dataBase) {
    warningMessage.style.display = "none";
    if (isObjectEmpty(dataBase)) {
        warningMessage.style.display = "block";
    }
}

function reloadStudentsTable(dataBase) {
    tableBody.innerHTML = "";
    for (const id in dataBase) {
        const data = dataBase[id];
        addStudentRow(id, data);
    }
    updateWarningMessage(dataBase);
}

function clearTable() {
    tableBody.innerHTML = "";
}

function updateLocalStorage() {
    localStorage.setItem("studentsData", JSON.stringify(studentsData));
    localStorage.setItem("currentId", currentId);
}

function setSubmitBtnMode(mode) {
    if (mode === "edit") {
        submitBtn.dataset.mode = "edit";
        submitBtn.classList.replace("btn-success", "btn-info");
        submitBtn.textContent = "Edit";
        return;
    }
    if (mode === "add") {
        submitBtn.dataset.mode = "add";
        submitBtn.classList.replace("btn-info", "btn-success");
        submitBtn.textContent = "Add";
        return;
    }
}

function addStudent(id, data) {
    studentsData[id] = data;
    updateWarningMessage(studentsData);
}

function addStudentRow(id, data) {
    const studentRow = document.createElement("tr");
    studentRow.dataset.id = id;
    studentRow.innerHTML = `
        <th scope="row">${id}</th>
        <td>${data.firstName}</td>
        <td>${data.lastName}</td>
        <td>${data.age}</td>
        <td>${data.email}</td>
        <td>${data.phone}</td>
        <td>
            <button class="btn btn-info text-light" onclick="editAction(this)">Edit</button>
            <button class="btn btn-danger text-light" onclick="deleteAction(this)">Delete</button>
        </td>`;
    tableBody.appendChild(studentRow);
}

function deleteAction(that) {
    const deleteConfirmation = confirm("Are you sure you want to delete this student?");
    if (!deleteConfirmation) return;
    const studentRow = that.closest("tr");
    delete studentsData[studentRow.dataset.id];
    studentRow.remove();
    updateLocalStorage();
    updateWarningMessage(studentsData);
}

function editAction(that) {
    const oldActiveUndoBtn = activeUndoButton;
    const editBtn = that;
    const studentRow = editBtn.closest("tr");
    const data = studentsData[studentRow.dataset.id];
    activeUndoButton = editBtn;
    currentEditRow = studentRow;
    setEditBtn(oldActiveUndoBtn);
    setUndoBtn(activeUndoButton);
    editMode(data);
}

function editMode(data) {
    for (const input of formInputs) {
        input.value = data[input.name];
        validateInput(input);
    }
    setSubmitBtnMode("edit");
}

function editStudentRow(studentRow, newData) {
    const id = studentRow.dataset.id;
    studentsData[id] = newData;
    updateLocalStorage();
    studentRow.innerHTML = `
        <th scope="row">${id}</th>
        <td>${newData.firstName}</td>
        <td>${newData.lastName}</td>
        <td>${newData.age}</td>
        <td>${newData.email}</td>
        <td>${newData.phone}</td>
        <td>
            <button class="btn btn-info text-light" onclick="editAction(this)">Edit</button>
            <button class="btn btn-danger text-light" onclick="deleteAction(this)">Delete</button>
        </td>`;
}

function setUndoBtn(btn) {
    if (!btn) return;
    btn.classList.replace("btn-info", "btn-primary");
    btn.textContent = "Undo";
    btn.onclick = undoEdit;
}

function setEditBtn(btn) {
    if (!btn) return;
    btn.classList.replace("btn-primary", "btn-info");
    btn.textContent = "Edit";
    btn.onclick = () => {
        editAction(btn);
    };
}

function undoEdit() {
    resetForm();
    setSubmitBtnMode("add");
    setEditBtn(activeUndoButton);
}

function validateInput(input) {
    const errorField = input.parentElement.nextElementSibling;
    const isValid = patterns[input.name].test(input.value.trim());
    const isEmpty = !input.value;
    if (isValid) {
        input.classList.add("is-valid");
        errorField.style.display = "none";
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
    }
    if (!isValid) {
        errorField.style.display = "block";
        errorField.textContent = "Invalid input!";
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
    }
    if (isEmpty) {
        errorField.style.display = "block";
        errorField.textContent = "This field is required!";
    }
    return isValid;
}

function validateInputs(inputs) {
    const data = {};
    let isFormValid = true;
    for (const input of inputs) {
        const isInputValid = validateInput(input);
        isFormValid = isFormValid && isInputValid;
        data[input.name] = input.value.trim();
    }
    return isFormValid ? data : null;
}

function resetForm() {
    for (const input of formInputs) {
        input.blur();
        input.classList.remove("is-valid");
        input.classList.remove("is-invalid");

        const errorField = input.parentElement.nextElementSibling;
        errorField.style.display = "none";
    }
    submitBtn.dataset.mode = "add";

    form.reset();
}

function submitData() {
    const data = validateInputs(formInputs);
    if (!data) return;
    if (submitBtn.dataset.mode === "add") {
        const id = currentId++;
        addStudent(id, data);
        addStudentRow(id, data);
        updateLocalStorage();
        resetForm();
        return;
    }
    if (submitBtn.dataset.mode === "edit") {
        editStudentRow(currentEditRow, data);
        setSubmitBtnMode("add");
        resetForm();
    }
}

function search(obj, query) {
    const searchResult = {};
    query = query.toLowerCase().trim();
    for (const id in obj) {
        const data = obj[id];
        if (id.includes(query)) {
            searchResult[id] = data;
            continue;
        }
        for (const key in data) {
            const value = data[key];
            if (value.toLowerCase().includes(query)) {
                searchResult[id] = data;
                break;
            }
        }
    }
    return searchResult;
}

reloadStudentsTable(studentsData);

form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitData();
});

resetBtn.addEventListener("click", () => {
    resetForm(form);
});

for (const input of formInputs) {
    input.addEventListener("blur", () => {
        validateInput(input);
    });
}

searchInput.addEventListener("input", () => {
    const query = searchInput.value;
    const results = search(studentsData, query);
    reloadStudentsTable(results);
});
