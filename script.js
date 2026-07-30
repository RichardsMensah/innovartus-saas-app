import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/*
|--------------------------------------------------------------------------
| STUDENT AND FIREBASE CONFIGURATION
|--------------------------------------------------------------------------
| Replace STUDENT_NAME and firebaseConfig with the correct student's data.
*/

const STUDENT_NAME = "Richard_Mensah";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCT9XRohe_D8cr19MfUYnIDH54xdIia3_4",
  authDomain: "richard-task-manager.firebaseapp.com",
  projectId: "richard-task-manager",
  storageBucket: "richard-task-manager.firebasestorage.app",
  messagingSenderId: "1090620327482",
  appId: "1:1090620327482:web:d4a4b22d433f3a430c5703"
};


// Initialize Firebase and Firestore.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firestore collection reference.
const tasksCollection = collection(db, "tasks");

// Interface elements.
const taskForm = getRequiredElement("taskForm");
const taskInput = getRequiredElement("taskInput");
const prioritySelect = getRequiredElement("prioritySelect");
const taskList = getRequiredElement("taskList");
const totalTasksElement = getRequiredElement("totalTasks");
const pendingTasksElement = getRequiredElement("pendingTasks");
const completedTasksElement = getRequiredElement("completedTasks");
const clearCompletedButton = getRequiredElement("clearCompletedBtn");

let currentTasks = [];

/**
 * Returns an HTML element or produces a useful error when an ID is missing.
 */
function getRequiredElement(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Required HTML element #${id} was not found.`);
  }

  return element;
}

/**
 * Adds a new task to Cloud Firestore.
 */
taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = taskInput.value.trim();
  const priority = prioritySelect.value;

  if (!title) {
    alert("Please enter a task.");
    taskInput.focus();
    return;
  }

  try {
    await addDoc(tasksCollection, {
      title: title,
      priority: priority,
      completed: false,
      student: STUDENT_NAME,
      createdAt: serverTimestamp()
    });

    taskInput.value = "";
    prioritySelect.value = "Low";
    taskInput.focus();
  } catch (error) {
    console.error("Task creation failed:", error);
    alert(
      "The task could not be saved. Check the Firebase configuration " +
      "and Firestore security rules."
    );
  }
});

/**
 * Listens continuously for Firestore changes.
 * The page updates whenever a task is added, changed or deleted.
 */
const tasksQuery = query(
  tasksCollection,
  orderBy("createdAt", "desc")
);

onSnapshot(
  tasksQuery,
  (snapshot) => {
    currentTasks = snapshot.docs.map((taskDocument) => ({
      id: taskDocument.id,
      ...taskDocument.data()
    }));

    renderTasks();
  },
  (error) => {
    console.error("Real-time Firestore listener failed:", error);

    taskList.replaceChildren();

    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent =
      "Unable to retrieve tasks. Check Firestore permissions.";

    taskList.appendChild(message);
  }
);

/**
 * Displays the current Firestore documents in the interface.
 */
function renderTasks() {
  taskList.replaceChildren();

  if (currentTasks.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent = "No tasks have been created.";
    taskList.appendChild(emptyMessage);

    updateStatistics();
    return;
  }

  const fragment = document.createDocumentFragment();

  currentTasks.forEach((task) => {
    const taskItem = document.createElement("div");
    taskItem.className = "task-item";

    if (task.completed) {
      taskItem.classList.add("completed");
    }

    const taskMain = document.createElement("div");
    taskMain.className = "task-main";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(task.completed);
    checkbox.setAttribute(
      "aria-label",
      `Mark ${task.title} as completed`
    );

    checkbox.addEventListener("change", async () => {
      try {
        await updateDoc(doc(db, "tasks", task.id), {
          completed: checkbox.checked
        });
      } catch (error) {
        console.error("Task update failed:", error);
        checkbox.checked = !checkbox.checked;
        alert("The task status could not be updated.");
      }
    });

    const taskTitle = document.createElement("span");
    taskTitle.className = "task-title";
    taskTitle.textContent = task.title;

    const priorityBadge = document.createElement("span");
    priorityBadge.className =
      `priority-badge priority-${String(task.priority).toLowerCase()}`;
    priorityBadge.textContent = task.priority || "Low";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", async () => {
      const confirmed = confirm(
        `Delete the task "${task.title}"?`
      );

      if (!confirmed) {
        return;
      }

      try {
        await deleteDoc(doc(db, "tasks", task.id));
      } catch (error) {
        console.error("Task deletion failed:", error);
        alert("The task could not be deleted.");
      }
    });

    taskMain.append(checkbox, taskTitle);
    taskItem.append(taskMain, priorityBadge, deleteButton);
    fragment.appendChild(taskItem);
  });

  taskList.appendChild(fragment);
  updateStatistics();
}

/**
 * Updates total, pending and completed values.
 */
function updateStatistics() {
  const total = currentTasks.length;
  const completed = currentTasks.filter(
    (task) => task.completed
  ).length;
  const pending = total - completed;

  totalTasksElement.textContent = String(total);
  pendingTasksElement.textContent = String(pending);
  completedTasksElement.textContent = String(completed);
}

/**
 * Deletes every completed task document.
 */
clearCompletedButton.addEventListener("click", async () => {
  const completedTasks = currentTasks.filter(
    (task) => task.completed
  );

  if (completedTasks.length === 0) {
    alert("There are no completed tasks to clear.");
    return;
  }

  const confirmed = confirm(
    `Delete ${completedTasks.length} completed task(s)?`
  );

  if (!confirmed) {
    return;
  }

  try {
    await Promise.all(
      completedTasks.map((task) =>
        deleteDoc(doc(db, "tasks", task.id))
      )
    );
  } catch (error) {
    console.error("Clearing completed tasks failed:", error);
    alert("Some completed tasks could not be deleted.");
  }
});