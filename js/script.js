function objectFromInputArray(array) {
    let object = {};
    for (input of array) {
        object[input.name] = input;
    }
    return object;
}

const inputFormElement = document.getElementById("input-form");

const inputForm = {
    form: inputFormElement,
    inputs: objectFromInputArray(inputFormElement.querySelectorAll("input")),
    btn: inputFormElement.querySelector("button"),
    validForm: false,

    patterns: {
        firstName: /^[a-z]+$/i,
        lastName: /^[a-z]+$/i,
        age: /^[1-9][0-9]{0,2}$/,
        email: /[\w\.\-\+\/]+@(gmail|yahoo).(com|org)$/,
        phone: /^(0020|\+20|0)(10|11|12|15)\d{8}$/,
    },

    validateInput: function (input) {
        const isEmpty = !input.value;
        const isValid = inputForm.patterns[input.name].test(input.value);
        const errorField = input.parentElement.nextElementSibling;
        let errorMessage = "";

        if (!isValid) {
            errorMessage = "Invalid input!";
        }
        if (isEmpty) {
            errorMessage = "This field is required!";
        }
        errorField.textContent = errorMessage;
        return isValid;
    },

    validateInputs: function () {
        let isValid = true;
        let data = {};
        for (key in inputForm.inputs) {
            const input = inputForm.inputs[key];
            const isInputValid = inputForm.validateInput(input);
            isValid = isValid && isInputValid;
            data[input.name] = input.value.trim();
        }
        inputForm.validForm = isValid;
        return isValid ? data : null;
    },

    submit: function () {
        const data = inputForm.validateInputs();
        if (data) {
            contentTable.appendStudent(data);
        }
    },
};

const contentTableElement = document.getElementById("view-table");

const contentTable = {
    table: contentTableElement,
    body: contentTableElement.querySelector("tbody"),
    students: JSON.parse(localStorage.getItem("studentsData")) ?? {},
    currentId: parseInt(localStorage.getItem("currentId") ?? 1),

    reloadStudents: function () {
        for (key in contentTable.students) {
            const student = contentTable.students[key];
            contentTable.createStudentRow(key, student);
        }
    },

    createStudentRow: function (id, data) {
        const tableRow = document.createElement("tr");
        tableRow.dataset.id = id;
        tableRow.innerHTML = `
            <th scope="row">${id}</th>
            <td>${data.firstName}</td>
            <td>${data.lastName}</td>
            <td>${data.age}</td>
            <td>${data.email}</td>
            <td>${data.phone}</td>
            <td>
                <button class="btn btn-info text-light")>Edit</button>
                <button class="btn btn-danger" onclick=contentTable.deleteStudent(${id})>Delete</button>
            </td>`;

        contentTable.body.appendChild(tableRow);
    },

    appendStudent: function (data) {
        const id = contentTable.currentId++;
        this.createStudentRow(id, data);
        contentTable.students[id] = data;
        localStorage.setItem(
            "studentsData",
            JSON.stringify(contentTable.students)
        );
        localStorage.setItem("currentId", contentTable.currentId);
    },

    deleteStudent: function (id) {
        delete contentTable.students[id];
        const student = contentTable.body.querySelector(`[data-id="${id}"]`);
        student.remove();
        localStorage.setItem(
            "studentsData",
            JSON.stringify(contentTable.students)
        );
    },
};

contentTable.reloadStudents();

inputForm.btn.addEventListener("click", (event) => {
    event.preventDefault();
    inputForm.submit();
});

for (key in inputForm.inputs) {
    const input = inputForm.inputs[key];
    input.addEventListener("blur", () => {
        inputForm.validateInput(input);
    });
}
