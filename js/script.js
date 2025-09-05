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
