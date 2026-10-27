const STORAGE_KEY = "studentStudyPlannerTasks";
const form = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const filterSelect = document.getElementById("filter");

let tasks = loadTasks();

document.getElementById("todayLabel").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "short", month: "short", day: "numeric", year: "numeric"
});
document.getElementById("deadline").value = new Date().toISOString().slice(0, 10);

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function render() {
  const filter = filterSelect.value;
  const visibleTasks = tasks.filter(task => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  taskList.innerHTML = visibleTasks.map(task => {
    const priorityClass = task.priority.toLowerCase();
    const due = task.deadline ? new Date(`${task.deadline}T00:00:00`).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric"
    }) : "No due date";
    return `
      <article class="task ${task.completed ? "done" : ""}">
        <input class="task-check" type="checkbox" aria-label="Mark ${escapeHtml(task.title)} complete"
          data-action="toggle" data-id="${task.id}" ${task.completed ? "checked" : ""}>
        <div>
          <p class="task-title">${escapeHtml(task.title)}</p>
          <p class="task-meta">${escapeHtml(task.subject)} · Due ${escapeHtml(due)} · ${Number(task.duration)} min</p>
          <div class="badges">
            <span class="badge ${priorityClass}">${escapeHtml(task.priority)} priority</span>
            <span class="badge">${task.completed ? "Completed" : "Pending"}</span>
          </div>
        </div>
        <button class="delete" type="button" data-action="delete" data-id="${task.id}">Delete</button>
      </article>`;
  }).join("");

  emptyState.hidden = visibleTasks.length > 0;
  const completed = tasks.filter(task => task.completed).length;
  const total = tasks.length;
  const pending = total - completed;
  const rate = total ? Math.round((completed / total) * 100) : 0;
  document.getElementById("totalTasks").textContent = total;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("pendingTasks").textContent = pending;
  document.getElementById("completionRate").textContent = `${rate}%`;
  document.getElementById("progressText").textContent = `${completed} of ${total}`;
  document.getElementById("progressBar").style.width = `${rate}%`;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(form);
  const task = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: String(data.get("taskTitle")).trim(),
    subject: String(data.get("subject")).trim(),
    deadline: String(data.get("deadline")),
    priority: String(data.get("priority")),
    duration: Number(data.get("duration")),
    completed: false
  };
  if (!task.title || !task.subject || !task.deadline || !Number.isFinite(task.duration) || task.duration < 5) return;
  tasks.unshift(task);
  saveTasks();
  form.reset();
  document.getElementById("deadline").value = new Date().toISOString().slice(0, 10);
  document.getElementById("duration").value = 30;
  render();
});

taskList.addEventListener("change", event => {
  const target = event.target;
  if (target.dataset.action !== "toggle") return;
  const task = tasks.find(item => item.id === target.dataset.id);
  if (task) {
    task.completed = target.checked;
    saveTasks();
    render();
  }
});

taskList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action='delete']");
  if (!button) return;
  tasks = tasks.filter(task => task.id !== button.dataset.id);
  saveTasks();
  render();
});

filterSelect.addEventListener("change", render);
render();
