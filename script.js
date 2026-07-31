import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCT9XRohe_D8cr19MfUYnIDH54xdIia3_4",
  authDomain: "richard-task-manager.firebaseapp.com",
  projectId: "richard-task-manager",
  storageBucket: "richard-task-manager.firebasestorage.app",
  messagingSenderId: "1090620327482",
  appId: "1:1090620327482:web:d4a4b22d433f3a430c5703"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

function getElement(id, required = true) {
  const element = document.getElementById(id);
  if (required && !element) {
    throw new Error(`Required element #${id} was not found.`);
  }
  return element;
}

const authSection = getElement("authSection");
const appSection = getElement("appSection");
const showLoginButton = getElement("showLoginBtn");
const showRegisterButton = getElement("showRegisterBtn");
const loginForm = getElement("loginForm");
const registerForm = getElement("registerForm");
const loginEmail = getElement("loginEmail");
const loginPassword = getElement("loginPassword");
const registerEmail = getElement("registerEmail");
const registerPassword = getElement("registerPassword");
const confirmPassword = getElement("confirmPassword");
const logoutButton = getElement("logoutBtn");
const authMessage = getElement("authMessage");
const headerUserEmail = getElement("headerUserEmail");
const headerStudentName = getElement("headerStudentName");
const headerStudentId = getElement("headerStudentId");
const profileEmail = getElement("profileEmail");
const mobileMenuBtn = getElement("mobileMenuBtn");
const mainNav = getElement("mainNav");
const statusMessage = getElement("statusMessage");
const loadingOverlay = getElement("loadingOverlay");
const toastStack = getElement("toastStack");
const seedDemoDataButton = getElement("seedDemoDataBtn");
const clearFiltersButton = getElement("clearFiltersBtn");
const searchInput = getElement("searchInput");
const courseFilterSelect = getElement("courseFilterSelect");
const typeFilterSelect = getElement("typeFilterSelect");
const categoryFilterSelect = getElement("categoryFilterSelect");
const priorityFilterSelect = getElement("priorityFilterSelect");
const statusFilterSelect = getElement("statusFilterSelect");
const dueFilterSelect = getElement("dueFilterSelect");
const sortFilterSelect = getElement("sortFilterSelect");
const activeFiltersBar = getElement("activeFiltersBar");
const summaryGrid = getElement("summaryGrid");
const reminderCard = getElement("reminderCard");
const recentActivitiesList = getElement("recentActivitiesList");
const activitiesList = getElement("activitiesList");
const sharedWithYouList = getElement("sharedWithYouList");
const recentTableBody = getElement("recentTableBody");
const completionChartCanvas = getElement("completionChart");
const courseChartCanvas = getElement("courseChart");
const typeChartCanvas = getElement("typeChart");
const priorityChartCanvas = getElement("priorityChart");
const weeklyChartCanvas = getElement("weeklyChart");
const dueOverviewChartCanvas = getElement("dueOverviewChart");
const activityForm = getElement("activityForm");
const activityTitleInput = getElement("activityTitleInput");
const activityCourseInput = getElement("activityCourseInput");
const activityTypeSelect = getElement("activityTypeSelect");
const activityCategorySelect = getElement("activityCategorySelect");
const activityPrioritySelect = getElement("activityPrioritySelect");
const activityStatusSelect = getElement("activityStatusSelect");
const activityDueDateInput = getElement("activityDueDateInput");
const activityReminderInput = getElement("activityReminderInput");
const activityShareEmailInput = getElement("activityShareEmailInput");
const editModal = getElement("editModal");
const editActivityForm = getElement("editActivityForm");
const editActivityId = getElement("editActivityId");
const editActivityTitle = getElement("editActivityTitle");
const editActivityCourse = getElement("editActivityCourse");
const editActivityType = getElement("editActivityType");
const editActivityCategory = getElement("editActivityCategory");
const editActivityPriority = getElement("editActivityPriority");
const editActivityStatus = getElement("editActivityStatus");
const editActivityDueDate = getElement("editActivityDueDate");
const editActivityReminder = getElement("editActivityReminder");
const editMessage = getElement("editMessage");
const closeEditButton = getElement("closeEditBtn");
const cancelEditButton = getElement("cancelEditBtn");
const shareModal = getElement("shareModal");
const shareActivityForm = getElement("shareActivityForm");
const shareEmailInput = getElement("shareEmailInput");
const closeShareButton = getElement("closeShareBtn");
const cancelShareButton = getElement("cancelShareBtn");
const confirmModal = getElement("confirmModal");
const confirmMessage = getElement("confirmMessage");
const closeConfirmButton = getElement("closeConfirmBtn");
const cancelConfirmButton = getElement("cancelConfirmBtn");
const confirmActionButton = getElement("confirmActionBtn");

let currentActivities = [];
let unsubscribeFromActivities = null;
let currentUser = null;
let reminderAlertedIds = new Set();
let pendingConfirmAction = null;
let activeShareActivityId = null;
const filterState = {
  search: "",
  course: "All",
  type: "All",
  category: "All",
  priority: "All",
  status: "All",
  due: "All",
  sort: "newest"
};
const chartInstances = {};

function setLoading(isLoading) {
  loadingOverlay.hidden = !isLoading;
}

function showAuthMessage(message, type = "") {
  authMessage.textContent = message;
  authMessage.className = "auth-message";
  if (type) {
    authMessage.classList.add(type);
  }
}

function showStatusMessage(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = "block";
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastStack.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2800);
}

function getAuthenticationError(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Choose a stronger password.";
    case "auth/invalid-credential":
      return "The email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return "Authentication failed. Please try again.";
  }
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    return new Date(value);
  }
  if (typeof value?.toDate === "function") {
    return value.toDate();
  }
  return null;
}

function formatDateTime(value) {
  const parsed = parseDateValue(value);
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return "Not scheduled";
  }
  return parsed.toLocaleString();
}

function formatShortDate(value) {
  const parsed = parseDateValue(value);
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return "Not scheduled";
  }
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getActivityStatus(activity) {
  return activity.status || (activity.completed ? "Completed" : "Pending");
}

function isCompleted(activity) {
  return getActivityStatus(activity) === "Completed";
}

function getSortValue(activity) {
  if (activity.createdAt?.toDate) {
    return activity.createdAt.toDate().getTime();
  }
  if (typeof activity.createdAt === "string") {
    return new Date(activity.createdAt).getTime();
  }
  if (activity.updatedAt?.toDate) {
    return activity.updatedAt.toDate().getTime();
  }
  return 0;
}

function getDueBucket(activity) {
  const dueDate = parseDateValue(activity.dueDate);
  if (!dueDate) {
    return "Upcoming";
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(startOfToday.getDate() + 7);

  if (dueDate < startOfToday) {
    return "Overdue";
  }
  if (dueDate <= endOfToday) {
    return "DueToday";
  }
  if (dueDate <= endOfWeek) {
    return "DueThisWeek";
  }
  return "Upcoming";
}

function buildActivityCard(activity) {
  const card = document.createElement("article");
  card.className = "activity-card";
  const isComplete = isCompleted(activity);
  const dueBucket = getDueBucket(activity);

  const header = document.createElement("div");
  header.className = "activity-card-header";
  const title = document.createElement("h4");
  title.textContent = activity.title;
  const badges = document.createElement("div");
  badges.innerHTML = `
    <span class="badge category">${activity.category || "Other"}</span>
    <span class="badge ${activity.priority?.toLowerCase() || "medium"}">${activity.priority || "Medium"}</span>
    <span class="badge ${isComplete ? "completed" : "pending"}">${getActivityStatus(activity)}</span>
    ${dueBucket === "Overdue" ? '<span class="badge overdue">Overdue</span>' : ""}
  `;
  header.append(title, badges);

  const meta = document.createElement("div");
  meta.className = "activity-meta";
  meta.innerHTML = `
    <div><strong>Course:</strong> ${activity.courseCode || "N/A"}</div>
    <div><strong>Type:</strong> ${activity.activityType || "Other"}</div>
    <div><strong>Due:</strong> ${formatDateTime(activity.dueDate)}</div>
    <div><strong>Reminder:</strong> ${activity.reminderAt ? formatDateTime(activity.reminderAt) : "Not scheduled"}</div>
    <div><strong>Owner:</strong> ${activity.ownerId === currentUser?.uid ? "You" : "Shared"}</div>
    <div><strong>Collaborators:</strong> ${activity.participantEmails?.length ? activity.participantEmails.join(", ") : "None"}</div>
  `;

  const actions = document.createElement("div");
  actions.className = "activity-actions";

  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = "primary-btn";
  completeButton.textContent = isComplete ? "Undo" : "Mark Complete";
  completeButton.addEventListener("click", async () => {
    if (!currentUser) {
      return;
    }
    const nextStatus = isComplete ? "Pending" : "Completed";
    await updateDoc(doc(db, "tasks", activity.id), {
      status: nextStatus,
      completed: nextStatus === "Completed",
      updatedAt: serverTimestamp()
    });
    showStatusMessage(`Activity marked as ${nextStatus.toLowerCase()}.`, "success");
    showToast(`Activity marked as ${nextStatus.toLowerCase()}.`, "success");
  });

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "secondary-btn";
  editButton.textContent = "Edit";
  editButton.addEventListener("click", () => openEditModal(activity));

  const shareButton = document.createElement("button");
  shareButton.type = "button";
  shareButton.className = "secondary-btn";
  shareButton.textContent = "Share";
  shareButton.addEventListener("click", () => openShareModal(activity));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "danger-btn";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => openConfirmModal(`Delete “${activity.title}”?`, async () => {
    if (!currentUser) {
      return;
    }
    await deleteDoc(doc(db, "tasks", activity.id));
    showStatusMessage("Activity deleted.", "success");
    showToast("Activity deleted.", "success");
  }));

  actions.append(completeButton, editButton, shareButton, deleteButton);
  card.append(header, meta, actions);
  return card;
}

function validateActivityInput(values) {
  const title = values.title.trim();
  const course = values.course.trim();
  if (!title) {
    return { valid: false, message: "Please enter an activity title." };
  }
  if (!course) {
    return { valid: false, message: "Please enter a course code." };
  }
  if (title.length > 200) {
    return { valid: false, message: "Activity titles cannot exceed 200 characters." };
  }
  if (course.length > 50) {
    return { valid: false, message: "Course codes cannot exceed 50 characters." };
  }
  return { valid: true, title, course };
}

function clearFilterState() {
  searchInput.value = "";
  courseFilterSelect.value = "All";
  typeFilterSelect.value = "All";
  categoryFilterSelect.value = "All";
  priorityFilterSelect.value = "All";
  statusFilterSelect.value = "All";
  dueFilterSelect.value = "All";
  sortFilterSelect.value = "newest";
  filterState.search = "";
  filterState.course = "All";
  filterState.type = "All";
  filterState.category = "All";
  filterState.priority = "All";
  filterState.status = "All";
  filterState.due = "All";
  filterState.sort = "newest";
  renderActiveFilters();
}

function renderActiveFilters() {
  const chips = [];
  if (filterState.search) {
    chips.push(`Search: ${filterState.search}`);
  }
  if (filterState.course !== "All") {
    chips.push(`Course: ${filterState.course}`);
  }
  if (filterState.type !== "All") {
    chips.push(`Type: ${filterState.type}`);
  }
  if (filterState.category !== "All") {
    chips.push(`Category: ${filterState.category}`);
  }
  if (filterState.priority !== "All") {
    chips.push(`Priority: ${filterState.priority}`);
  }
  if (filterState.status !== "All") {
    chips.push(`Status: ${filterState.status}`);
  }
  if (filterState.due !== "All") {
    chips.push(`Due: ${filterState.due}`);
  }
  activeFiltersBar.innerHTML = chips.length ? chips.map((chip) => `<span class="chip">${chip}</span>`).join("") : "";
}

function getFilteredActivities(activities) {
  const matchesSearch = (activity) => {
    if (!filterState.search) {
      return true;
    }
    const haystack = `${activity.title} ${activity.courseCode}`.toLowerCase();
    return haystack.includes(filterState.search.toLowerCase());
  };

  const matchesCourse = (activity) => filterState.course === "All" || activity.courseCode === filterState.course;
  const matchesType = (activity) => filterState.type === "All" || activity.activityType === filterState.type;
  const matchesCategory = (activity) => filterState.category === "All" || activity.category === filterState.category;
  const matchesPriority = (activity) => filterState.priority === "All" || activity.priority === filterState.priority;
  const matchesStatus = (activity) => filterState.status === "All" || getActivityStatus(activity) === filterState.status;
  const matchesDue = (activity) => filterState.due === "All" || getDueBucket(activity) === filterState.due;

  const filtered = activities.filter((activity) => matchesSearch(activity) && matchesCourse(activity) && matchesType(activity) && matchesCategory(activity) && matchesPriority(activity) && matchesStatus(activity) && matchesDue(activity));

  const sorted = [...filtered].sort((firstActivity, secondActivity) => {
    switch (filterState.sort) {
      case "oldest":
        return getSortValue(firstActivity) - getSortValue(secondActivity);
      case "dueAsc":
        return (parseDateValue(firstActivity.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER) - (parseDateValue(secondActivity.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER);
      case "dueDesc":
        return (parseDateValue(secondActivity.dueDate)?.getTime() || Number.MIN_SAFE_INTEGER) - (parseDateValue(firstActivity.dueDate)?.getTime() || Number.MIN_SAFE_INTEGER);
      case "priority":
        return ("HighMediumLow".indexOf(secondActivity.priority || "Medium") - "HighMediumLow".indexOf(firstActivity.priority || "Medium"));
      case "alpha":
        return (firstActivity.title || "").localeCompare(secondActivity.title || "");
      case "newest":
      default:
        return getSortValue(secondActivity) - getSortValue(firstActivity);
    }
  });

  return sorted;
}

function updateSummary() {
  const total = currentActivities.length;
  const pending = currentActivities.filter((activity) => getActivityStatus(activity) === "Pending").length;
  const inProgress = currentActivities.filter((activity) => getActivityStatus(activity) === "In Progress").length;
  const completed = currentActivities.filter((activity) => getActivityStatus(activity) === "Completed").length;
  const overdue = currentActivities.filter((activity) => getDueBucket(activity) === "Overdue").length;
  const dueThisWeek = currentActivities.filter((activity) => ["DueToday", "DueThisWeek"].includes(getDueBucket(activity))).length;

  summaryGrid.innerHTML = `
    <div class="stat-card"><h3>Total</h3><div class="value">${total}</div></div>
    <div class="stat-card"><h3>Pending</h3><div class="value">${pending}</div></div>
    <div class="stat-card"><h3>In Progress</h3><div class="value">${inProgress}</div></div>
    <div class="stat-card"><h3>Completed</h3><div class="value">${completed}</div></div>
    <div class="stat-card"><h3>Overdue</h3><div class="value">${overdue}</div></div>
    <div class="stat-card"><h3>Due this week</h3><div class="value">${dueThisWeek}</div></div>
  `;

  const upcomingReminder = currentActivities.find((activity) => activity.reminderAt && !isCompleted(activity));
  if (upcomingReminder) {
    reminderCard.hidden = false;
    reminderCard.innerHTML = `<strong>Reminder:</strong> ${upcomingReminder.title} • ${formatDateTime(upcomingReminder.reminderAt)}`;
  } else {
    reminderCard.hidden = true;
  }
}

function renderRecentActivities() {
  const recent = [...currentActivities].sort((firstActivity, secondActivity) => getSortValue(secondActivity) - getSortValue(firstActivity)).slice(0, 6);
  recentActivitiesList.replaceChildren();
  if (recent.length === 0) {
    recentActivitiesList.innerHTML = '<p class="empty-state">No activities yet. Create one to begin planning.</p>';
    return;
  }
  const fragment = document.createDocumentFragment();
  recent.forEach((activity) => {
    const item = document.createElement("div");
    item.className = "activity-card";
    item.innerHTML = `
      <div class="activity-card-header">
        <h4>${activity.title}</h4>
        <span class="badge ${activity.priority?.toLowerCase() || "medium"}">${activity.priority || "Medium"}</span>
      </div>
      <div class="activity-meta">
        <div><strong>Course:</strong> ${activity.courseCode || "N/A"}</div>
        <div><strong>Status:</strong> ${getActivityStatus(activity)}</div>
        <div><strong>Due:</strong> ${formatDateTime(activity.dueDate)}</div>
      </div>
    `;
    fragment.appendChild(item);
  });
  recentActivitiesList.appendChild(fragment);
}

function renderActivitiesList() {
  const filtered = getFilteredActivities(currentActivities);
  activitiesList.replaceChildren();
  if (filtered.length === 0) {
    activitiesList.innerHTML = '<p class="empty-state">No activities match your current filters.</p>';
    return;
  }
  const fragment = document.createDocumentFragment();
  filtered.forEach((activity) => fragment.appendChild(buildActivityCard(activity)));
  activitiesList.appendChild(fragment);
}

function renderSharedActivities() {
  const shared = currentActivities.filter((activity) => activity.ownerId !== currentUser?.uid && activity.participants?.includes(currentUser?.uid));
  sharedWithYouList.replaceChildren();
  if (shared.length === 0) {
    sharedWithYouList.innerHTML = '<p class="empty-state">No shared activities yet.</p>';
    return;
  }
  const fragment = document.createDocumentFragment();
  shared.forEach((activity) => {
    const card = buildActivityCard(activity);
    fragment.appendChild(card);
  });
  sharedWithYouList.appendChild(fragment);
}

function renderRecentTable() {
  const recent = [...currentActivities].sort((firstActivity, secondActivity) => getSortValue(secondActivity) - getSortValue(firstActivity)).slice(0, 8);
  recentTableBody.replaceChildren();
  if (recent.length === 0) {
    recentTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No activities to report yet.</td></tr>';
    return;
  }
  const fragment = document.createDocumentFragment();
  recent.forEach((activity) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${activity.title}</td>
      <td>${activity.courseCode || "N/A"}</td>
      <td>${activity.activityType || "Other"}</td>
      <td>${getActivityStatus(activity)}</td>
      <td>${formatShortDate(activity.updatedAt || activity.createdAt)}</td>
      <td>${activity.ownerId === currentUser?.uid ? "You" : "Shared"}</td>
    `;
    fragment.appendChild(row);
  });
  recentTableBody.appendChild(fragment);
}

function populateCourseFilter() {
  const uniqueCourses = [...new Set(currentActivities.map((activity) => activity.courseCode).filter(Boolean))].sort();
  const currentSelection = courseFilterSelect.value;
  courseFilterSelect.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "All";
  allOption.textContent = "All courses";
  courseFilterSelect.appendChild(allOption);
  uniqueCourses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course;
    option.textContent = course;
    courseFilterSelect.appendChild(option);
  });
  if (uniqueCourses.includes(currentSelection)) {
    courseFilterSelect.value = currentSelection;
  } else {
    courseFilterSelect.value = "All";
  }
}

function destroyCharts() {
  Object.values(chartInstances).forEach((chart) => chart.destroy());
  Object.keys(chartInstances).forEach((key) => delete chartInstances[key]);
}

function renderAnalytics() {
  const total = currentActivities.length;
  const completed = currentActivities.filter((activity) => isCompleted(activity)).length;
  const pending = currentActivities.filter((activity) => getActivityStatus(activity) === "Pending").length;
  const inProgress = currentActivities.filter((activity) => getActivityStatus(activity) === "In Progress").length;
  const overdue = currentActivities.filter((activity) => getDueBucket(activity) === "Overdue").length;
  const dueToday = currentActivities.filter((activity) => getDueBucket(activity) === "DueToday").length;
  const dueThisWeek = currentActivities.filter((activity) => getDueBucket(activity) === "DueThisWeek").length;
  const upcoming = currentActivities.filter((activity) => getDueBucket(activity) === "Upcoming").length;

  destroyCharts();

  const completionData = [completed, pending, inProgress];
  chartInstances.completion = new window.Chart(completionChartCanvas, {
    type: "doughnut",
    data: {
      labels: ["Completed", "Pending", "In Progress"],
      datasets: [{ data: completionData, backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b"] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const courseCounts = currentActivities.reduce((counts, activity) => {
    const key = activity.courseCode || "Unassigned";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  chartInstances.course = new window.Chart(courseChartCanvas, {
    type: "bar",
    data: {
      labels: Object.keys(courseCounts),
      datasets: [{ label: "Activities by course", data: Object.values(courseCounts), backgroundColor: "#2563eb" }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const typeCounts = currentActivities.reduce((counts, activity) => {
    const key = activity.activityType || "Other";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  chartInstances.type = new window.Chart(typeChartCanvas, {
    type: "pie",
    data: {
      labels: Object.keys(typeCounts),
      datasets: [{ data: Object.values(typeCounts), backgroundColor: ["#2563eb", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6366f1"] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const priorityCounts = currentActivities.reduce((counts, activity) => {
    const key = activity.priority || "Medium";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  chartInstances.priority = new window.Chart(priorityChartCanvas, {
    type: "bar",
    data: {
      labels: Object.keys(priorityCounts),
      datasets: [{ label: "Activities by priority", data: Object.values(priorityCounts), backgroundColor: ["#ef4444", "#f59e0b", "#22c55e"] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const weeklyCounts = [
    currentActivities.filter((activity) => activity.createdAt && parseDateValue(activity.createdAt) && parseDateValue(activity.createdAt) >= new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)).length,
    currentActivities.filter((activity) => activity.createdAt && parseDateValue(activity.createdAt) && parseDateValue(activity.createdAt) >= new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)).length,
    currentActivities.filter((activity) => activity.createdAt && parseDateValue(activity.createdAt) && parseDateValue(activity.createdAt) >= new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)).length,
    currentActivities.filter((activity) => activity.createdAt && parseDateValue(activity.createdAt) && parseDateValue(activity.createdAt) >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)).length,
    currentActivities.filter((activity) => activity.createdAt && parseDateValue(activity.createdAt) && parseDateValue(activity.createdAt) >= new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)).length,
    currentActivities.filter((activity) => activity.createdAt && parseDateValue(activity.createdAt) && parseDateValue(activity.createdAt) >= new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)).length,
    total
  ];
  chartInstances.weekly = new window.Chart(weeklyChartCanvas, {
    type: "line",
    data: {
      labels: ["6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "1d ago", "Today"],
      datasets: [{ label: "Recent activity trend", data: weeklyCounts, borderColor: "#2563eb", fill: false, tension: 0.3 }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  chartInstances.dueOverview = new window.Chart(dueOverviewChartCanvas, {
    type: "doughnut",
    data: {
      labels: ["Overdue", "Due today", "Due this week", "Upcoming"],
      datasets: [{ data: [overdue, dueToday, dueThisWeek, upcoming], backgroundColor: ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e"] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderDashboard() {
  updateSummary();
  renderRecentActivities();
  renderRecentTable();
}

function renderAllViews() {
  populateCourseFilter();
  renderDashboard();
  renderActivitiesList();
  renderSharedActivities();
  renderAnalytics();
}

function showSection(sectionId) {
  document.querySelectorAll(".app-section").forEach((section) => section.classList.toggle("active", section.id === sectionId));
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.section === sectionId));
}

function openEditModal(activity) {
  editActivityId.value = activity.id;
  editActivityTitle.value = activity.title || "";
  editActivityCourse.value = activity.courseCode || "";
  editActivityType.value = activity.activityType || "Study Session";
  editActivityCategory.value = activity.category || "Academic";
  editActivityPriority.value = activity.priority || "Medium";
  editActivityStatus.value = getActivityStatus(activity);
  editActivityDueDate.value = activity.dueDate || "";
  editActivityReminder.value = activity.reminderAt || "";
  editMessage.textContent = "";
  editModal.hidden = false;
  editActivityTitle.focus();
}

function closeEditModal() {
  editModal.hidden = true;
  editActivityForm.reset();
  editMessage.textContent = "";
}

function openShareModal(activity) {
  activeShareActivityId = activity.id;
  shareEmailInput.value = "";
  shareModal.hidden = false;
  shareEmailInput.focus();
}

function closeShareModal() {
  shareModal.hidden = true;
  shareActivityForm.reset();
  activeShareActivityId = null;
}

function openConfirmModal(message, onConfirm) {
  confirmMessage.textContent = message;
  pendingConfirmAction = onConfirm;
  confirmModal.hidden = false;
}

function closeConfirmModal() {
  confirmModal.hidden = true;
  pendingConfirmAction = null;
}

function showReminder(activity) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification("Study reminder", {
      body: `${activity.title} is due${activity.dueDate ? ` at ${formatDateTime(activity.dueDate)}` : ""}.`
    });
  } else {
    window.alert(`Reminder: ${activity.title}`);
  }
}

function checkReminders() {
  currentActivities.forEach((activity) => {
    if (reminderAlertedIds.has(activity.id) || isCompleted(activity)) {
      return;
    }
    const reminderTime = parseDateValue(activity.reminderAt);
    if (!reminderTime) {
      return;
    }
    if (reminderTime <= new Date()) {
      reminderAlertedIds.add(activity.id);
      showReminder(activity);
    }
  });
}

async function ensureUserProfile(user) {
  const profileDoc = doc(db, "users", user.uid);
  const profileSnapshot = await getDoc(profileDoc);
  if (!profileSnapshot.exists()) {
    await setDoc(profileDoc, {
      email: user.email || "",
      displayName: (user.email || "user").split("@")[0],
      createdAt: serverTimestamp()
    });
  }
}

async function resolveUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const userQuery = query(collection(db, "users"), where("email", "==", normalizedEmail));
  const snapshot = await getDocs(userQuery);
  if (snapshot.empty) {
    return null;
  }
  const userDocument = snapshot.docs[0];
  return { uid: userDocument.id, ...userDocument.data() };
}

function subscribeToActivities(userId) {
  const activityQuery = query(collection(db, "tasks"), where("participants", "array-contains", userId));
  unsubscribeFromActivities = onSnapshot(activityQuery, (snapshot) => {
    currentActivities = snapshot.docs.map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() }));
    currentActivities.sort((firstActivity, secondActivity) => getSortValue(secondActivity) - getSortValue(firstActivity));
    renderAllViews();
  }, (error) => {
    console.error("Activity retrieval failed:", error);
    activitiesList.innerHTML = '<p class="empty-state">Unable to load your activities right now.</p>';
  });
}

showLoginButton.addEventListener("click", () => {
  loginForm.hidden = false;
  registerForm.hidden = true;
  showLoginButton.classList.add("active");
  showRegisterButton.classList.remove("active");
  showAuthMessage("");
});

showRegisterButton.addEventListener("click", () => {
  loginForm.hidden = true;
  registerForm.hidden = false;
  showRegisterButton.classList.add("active");
  showLoginButton.classList.remove("active");
  showAuthMessage("");
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = registerEmail.value.trim();
  const password = registerPassword.value;
  const confirmedPassword = confirmPassword.value;

  if (password !== confirmedPassword) {
    showAuthMessage("The passwords do not match.", "error");
    return;
  }
  if (password.length < 6) {
    showAuthMessage("The password must contain at least six characters.", "error");
    return;
  }

  try {
    setLoading(true);
    showAuthMessage("Creating account...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(userCredential.user);
    registerForm.reset();
    showAuthMessage("Account created successfully.", "success");
    showToast("Account created successfully.", "success");
  } catch (error) {
    console.error("Registration failed:", error);
    showAuthMessage(getAuthenticationError(error), "error");
  } finally {
    setLoading(false);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  try {
    setLoading(true);
    showAuthMessage("Signing in...");
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
    showAuthMessage("");
  } catch (error) {
    console.error("Login failed:", error);
    showAuthMessage(getAuthenticationError(error), "error");
  } finally {
    setLoading(false);
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    showToast("The account could not be logged out.", "error");
  }
});

onAuthStateChanged(auth, async (user) => {
  if (unsubscribeFromActivities) {
    unsubscribeFromActivities();
    unsubscribeFromActivities = null;
  }

  currentUser = user;
  if (user) {
    authSection.hidden = true;
    appSection.hidden = false;
    headerUserEmail.textContent = user.email || "Authenticated user";
    headerStudentName.textContent = "Richard Mensah";
    headerStudentId.textContent = "Student ID: 080019754639";
    profileEmail.textContent = user.email || "";
    await ensureUserProfile(user);
    subscribeToActivities(user.uid);
  } else {
    authSection.hidden = false;
    appSection.hidden = true;
    headerUserEmail.textContent = "Signed out";
    headerStudentName.textContent = "Richard Mensah";
    headerStudentId.textContent = "Student ID: 080019754639";
    profileEmail.textContent = "";
    currentActivities = [];
    reminderAlertedIds.clear();
    clearFilterState();
    renderAllViews();
  }
});

activityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser) {
    showStatusMessage("You must log in before creating an activity.", "error");
    showToast("You must log in before creating an activity.", "error");
    return;
  }

  const validation = validateActivityInput({
    title: activityTitleInput.value,
    course: activityCourseInput.value
  });
  if (!validation.valid) {
    showStatusMessage(validation.message, "error");
    showToast(validation.message, "error");
    return;
  }

  const shareEmail = activityShareEmailInput.value.trim().toLowerCase();
  let participants = [currentUser.uid];
  let participantEmails = [];
  if (currentUser.email) {
    participantEmails.push(currentUser.email);
  }

  if (shareEmail && shareEmail !== currentUser.email) {
    const collaborator = await resolveUserByEmail(shareEmail);
    if (!collaborator) {
      showStatusMessage("No registered user matched that email.", "error");
      showToast("No registered user matched that email.", "error");
      return;
    }
    participants = [...new Set([...participants, collaborator.uid])];
    participantEmails = [...new Set([...participantEmails, collaborator.email])];
  }

  try {
    setLoading(true);
    await addDoc(collection(db, "tasks"), {
      title: validation.title,
      courseCode: validation.course,
      activityType: activityTypeSelect.value,
      category: activityCategorySelect.value,
      priority: activityPrioritySelect.value,
      status: activityStatusSelect.value,
      completed: activityStatusSelect.value === "Completed",
      dueDate: activityDueDateInput.value || "",
      reminderAt: activityReminderInput.value || "",
      ownerId: currentUser.uid,
      participants,
      participantEmails,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    activityForm.reset();
    activityTypeSelect.value = "Study Session";
    activityCategorySelect.value = "Academic";
    activityPrioritySelect.value = "High";
    activityStatusSelect.value = "Pending";
    showStatusMessage("Activity created successfully.", "success");
    showToast("Activity created successfully.", "success");
  } catch (error) {
    console.error("Activity creation failed:", error);
    showStatusMessage("The activity could not be saved.", "error");
    showToast("The activity could not be saved.", "error");
  } finally {
    setLoading(false);
  }
});

editActivityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser) {
    showStatusMessage("You must log in before editing an activity.", "error");
    return;
  }

  const validation = validateActivityInput({
    title: editActivityTitle.value,
    course: editActivityCourse.value
  });
  if (!validation.valid) {
    editMessage.textContent = validation.message;
    return;
  }

  try {
    setLoading(true);
    await updateDoc(doc(db, "tasks", editActivityId.value), {
      title: validation.title,
      courseCode: validation.course,
      activityType: editActivityType.value,
      category: editActivityCategory.value,
      priority: editActivityPriority.value,
      status: editActivityStatus.value,
      completed: editActivityStatus.value === "Completed",
      dueDate: editActivityDueDate.value || "",
      reminderAt: editActivityReminder.value || "",
      updatedAt: serverTimestamp()
    });
    closeEditModal();
    showStatusMessage("Activity updated successfully.", "success");
    showToast("Activity updated successfully.", "success");
  } catch (error) {
    console.error("Activity update failed:", error);
    editMessage.textContent = "The activity could not be updated.";
  } finally {
    setLoading(false);
  }
});

shareActivityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !activeShareActivityId) {
    return;
  }

  const collaboratorEmail = shareEmailInput.value.trim().toLowerCase();
  if (!collaboratorEmail) {
    showToast("Enter a collaborator email.", "error");
    return;
  }

  const collaborator = await resolveUserByEmail(collaboratorEmail);
  if (!collaborator) {
    showStatusMessage("No registered user matched that email.", "error");
    showToast("No registered user matched that email.", "error");
    return;
  }

  try {
    setLoading(true);
    await updateDoc(doc(db, "tasks", activeShareActivityId), {
      participants: arrayUnion(collaborator.uid),
      participantEmails: arrayUnion(collaborator.email)
    });
    closeShareModal();
    showStatusMessage(`Activity shared with ${collaborator.email}.`, "success");
    showToast(`Activity shared with ${collaborator.email}.`, "success");
  } catch (error) {
    console.error("Activity share failed:", error);
    showStatusMessage("The activity could not be shared.", "error");
    showToast("The activity could not be shared.", "error");
  } finally {
    setLoading(false);
  }
});

confirmActionButton.addEventListener("click", async () => {
  if (pendingConfirmAction) {
    try {
      await pendingConfirmAction();
    } catch (error) {
      console.error("Confirm action failed:", error);
    }
  }
  closeConfirmModal();
});

[closeEditButton, cancelEditButton].forEach((button) => button.addEventListener("click", closeEditModal));
[closeShareButton, cancelShareButton].forEach((button) => button.addEventListener("click", closeShareModal));
[closeConfirmButton, cancelConfirmButton].forEach((button) => button.addEventListener("click", closeConfirmModal));

editModal.addEventListener("click", (event) => {
  if (event.target === editModal) {
    closeEditModal();
  }
});

shareModal.addEventListener("click", (event) => {
  if (event.target === shareModal) {
    closeShareModal();
  }
});

confirmModal.addEventListener("click", (event) => {
  if (event.target === confirmModal) {
    closeConfirmModal();
  }
});

[searchInput, courseFilterSelect, typeFilterSelect, categoryFilterSelect, priorityFilterSelect, statusFilterSelect, dueFilterSelect, sortFilterSelect].forEach((element) => {
  element.addEventListener("input", () => {
    filterState.search = searchInput.value.trim();
    filterState.course = courseFilterSelect.value;
    filterState.type = typeFilterSelect.value;
    filterState.category = categoryFilterSelect.value;
    filterState.priority = priorityFilterSelect.value;
    filterState.status = statusFilterSelect.value;
    filterState.due = dueFilterSelect.value;
    filterState.sort = sortFilterSelect.value;
    renderActiveFilters();
    renderActivitiesList();
  });
});

[courseFilterSelect, typeFilterSelect, categoryFilterSelect, priorityFilterSelect, statusFilterSelect, dueFilterSelect, sortFilterSelect].forEach((select) => {
  select.addEventListener("change", () => {
    filterState.search = searchInput.value.trim();
    filterState.course = courseFilterSelect.value;
    filterState.type = typeFilterSelect.value;
    filterState.category = categoryFilterSelect.value;
    filterState.priority = priorityFilterSelect.value;
    filterState.status = statusFilterSelect.value;
    filterState.due = dueFilterSelect.value;
    filterState.sort = sortFilterSelect.value;
    renderActiveFilters();
    renderActivitiesList();
  });
});

clearFiltersButton.addEventListener("click", () => {
  clearFilterState();
  renderActivitiesList();
});

seedDemoDataButton.addEventListener("click", async () => {
  if (!currentUser) {
    return;
  }
  const demoActivities = [
    { title: "Complete AI assignment draft", courseCode: "CS 301", activityType: "Assignment", category: "Academic", priority: "High", status: "Pending", dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), reminderAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
    { title: "Review network notes", courseCode: "CS 402", activityType: "Revision", category: "Academic", priority: "Medium", status: "In Progress", dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), reminderAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
    { title: "Submit internship application", courseCode: "Career", activityType: "Project", category: "Work", priority: "High", status: "Pending", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), reminderAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  try {
    setLoading(true);
    await Promise.all(demoActivities.map((activity) => addDoc(collection(db, "tasks"), {
      title: activity.title,
      courseCode: activity.courseCode,
      activityType: activity.activityType,
      category: activity.category,
      priority: activity.priority,
      status: activity.status,
      completed: activity.status === "Completed",
      dueDate: activity.dueDate,
      reminderAt: activity.reminderAt,
      ownerId: currentUser.uid,
      participants: [currentUser.uid],
      participantEmails: [currentUser.email || ""],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })));
    showStatusMessage("Demo activities added.", "success");
    showToast("Demo activities added.", "success");
  } catch (error) {
    console.error("Demo data failed:", error);
    showStatusMessage("Demo data could not be added.", "error");
    showToast("Demo data could not be added.", "error");
  } finally {
    setLoading(false);
  }
});

mobileMenuBtn.addEventListener("click", () => {
  mainNav.classList.toggle("open");
});

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => showSection(link.dataset.section));
});

if (typeof Notification !== "undefined" && Notification.permission === "default") {
  Notification.requestPermission().catch(() => {});
}

setInterval(() => {
  checkReminders();
}, 60000);

renderAllViews();
