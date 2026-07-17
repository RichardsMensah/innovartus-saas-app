const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskPriority = document.getElementById("taskPriority");
const taskList = document.getElementById("taskList");
const clearCompletedButton = document.getElementById("clearCompleted");

let tasks = loadTasks();

function loadTasks() {
    try {
        const storedTasks = localStorage.getItem("innovartusTasks");
        return storedTasks ? JSON.parse(storedTasks) : [];
    } catch (error) {
        console.error("Unable to load tasks:", error);
        return [];
    }
}

function saveTasks() {
    localStorage.setItem("innovartusTasks", JSON.stringify(tasks));
}

function createTask(taskName, priority) {
    return {
        id: Date.now(),
        name: taskName,
        priority: priority,
        completed: false
    };
}

function addTask(event) {
    event.preventDefault();

    const taskName = taskInput.value.trim();

    if (!taskName) {
        alert("Please enter a valid task.");
        return;
    }

    tasks.push(createTask(taskName, taskPriority.value));

    saveTasks();
    renderTasks();

    taskForm.reset();
    taskInput.focus();
}

function toggleTask(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return {
                ...task,
                completed: !task.completed
            };
        }

        return task;
    });

    saveTasks();
    renderTasks();
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
}

function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

function updateStatistics() {
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.length - completed;

    document.getElementById("totalTasks").textContent = tasks.length;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("completedTasks").textContent = completed;
}

function renderTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
        taskList.innerHTML =
            '<p class="empty-message">No tasks have been created.</p>';

        updateStatistics();
        return;
    }

    tasks.forEach(task => {
        const taskElement = document.createElement("div");
        taskElement.className = "task-item";

        taskElement.innerHTML = `
            <input
                type="checkbox"
                aria-label="Mark task as completed"
                ${task.completed ? "checked" : ""}
            >

            <span class="task-name ${task.completed ? "completed" : ""}">
                ${escapeHTML(task.name)}
            </span>

            <span class="priority priority-${task.priority.toLowerCase()}">
                ${task.priority}
            </span>

            <button class="delete-button" type="button">
                Delete
            </button>
        `;

        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        const deleteButton = taskElement.querySelector(".delete-button");

        checkbox.addEventListener("change", () => toggleTask(task.id));
        deleteButton.addEventListener("click", () => deleteTask(task.id));

        taskList.appendChild(taskElement);
    });

    updateStatistics();
}

function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
}

taskForm.addEventListener("submit", addTask);
clearCompletedButton.addEventListener("click", clearCompletedTasks);

renderTasks();