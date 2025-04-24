// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const tasksContainer = document.getElementById("tasksContainer");
const showAllBtn = document.getElementById("showAll");
const showActiveBtn = document.getElementById("showActive");
const showCompletedBtn = document.getElementById("showCompleted");

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Event Listeners
addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

showAllBtn.addEventListener("click", () => filterTasks("all"));
showActiveBtn.addEventListener("click", () => filterTasks("active"));
showCompletedBtn.addEventListener("click", () => filterTasks("completed"));

function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText) {
    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      createdAt: new Date(),
    };
    tasks.push(newTask);
    saveTasks();
    taskInput.value = "";
    renderTasks();
    taskInput.focus();
  }
}

function renderTasks() {
  // Filter tasks based on current filter
  let filteredTasks = tasks;
  if (currentFilter === "active") {
    filteredTasks = tasks.filter((task) => !task.completed);
  } else if (currentFilter === "completed") {
    filteredTasks = tasks.filter((task) => task.completed);
  }

  // Clear the container
  tasksContainer.innerHTML = "";

  // Show message if no tasks
  if (filteredTasks.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "p-6 text-center text-gray-500 animate-fade-in";
    emptyMessage.innerHTML = `
            <i class="fas fa-clipboard-list text-3xl mb-2 text-gray-300"></i>
            <p class="text-lg">${
              currentFilter === "all"
                ? "No tasks yet. Add one above!"
                : `No ${currentFilter} tasks.`
            }</p>
        `;
    tasksContainer.appendChild(emptyMessage);
    return;
  }

  // Sort tasks by creation date (newest first)
  filteredTasks.sort((a, b) => b.createdAt - a.createdAt);

  // Render each task with animation
  filteredTasks.forEach((task, index) => {
    const taskElement = document.createElement("div");
    taskElement.className = `task-item p-4 border-b flex items-center transition-all duration-150 ${
      task.completed ? "bg-gray-50" : "bg-white"
    } hover:bg-gray-50 animate-slide-in`;
    taskElement.style.animationDelay = `${index * 0.05}s`;
    taskElement.dataset.id = task.id;

    taskElement.innerHTML = `
            <div class="flex items-center w-full">
                <input 
                    type="checkbox" 
                    ${task.completed ? "checked" : ""}
                    class="task-checkbox mr-3 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    data-id="${task.id}"
                >
                <span class="task-text flex-grow ${
                  task.completed
                    ? "line-through text-gray-400"
                    : "text-gray-800"
                }">
                    ${task.text}
                </span>
                <div class="flex space-x-2">
                    <button 
                        onclick="startEditing(${task.id})"
                        class="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 transition"
                        title="Edit task"
                    >
                        <i class="fas fa-edit"></i>
                    </button>
                    <button 
                        onclick="prepareDeleteTask(${task.id})"
                        class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition"
                        title="Delete task"
                    >
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    tasksContainer.appendChild(taskElement);

    // Add event listener to the checkbox
    const checkbox = taskElement.querySelector(".task-checkbox");
    checkbox.addEventListener("change", function () {
      const taskId = parseInt(this.dataset.id);
      const taskElement = this.closest(".task-item");

      // Apply animation
      taskElement.classList.add("animate-task-complete");
      this.classList.add("animate-check-bounce");

      // Update task status without full re-render
      setTimeout(() => {
        tasks = tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        saveTasks();

        // Update UI directly
        const taskText = taskElement.querySelector(".task-text");
        if (this.checked) {
          taskText.classList.add("line-through", "text-gray-400");
          taskText.classList.remove("text-gray-800");
          taskElement.classList.add("bg-gray-50");
          taskElement.classList.remove("bg-white");
        } else {
          taskText.classList.remove("line-through", "text-gray-400");
          taskText.classList.add("text-gray-800");
          taskElement.classList.remove("bg-gray-50");
          taskElement.classList.add("bg-white");
        }

        // Remove animation classes
        taskElement.classList.remove("animate-task-complete");
        this.classList.remove("animate-check-bounce");

        // Re-filter if needed
        if (currentFilter !== "all") {
          setTimeout(() => {
            if (
              (currentFilter === "active" && this.checked) ||
              (currentFilter === "completed" && !this.checked)
            ) {
              taskElement.classList.add("animate-fade-out");
              setTimeout(() => {
                taskElement.remove();
                if (tasksContainer.children.length === 0) {
                  renderTasks(); // Show empty message if needed
                }
              }, 300);
            }
          }, 200);
        }
      }, 100);
    });
  });
}

function prepareDeleteTask(id) {
  const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
  taskElement.classList.add("animate-fade-out");

  setTimeout(() => {
    deleteTask(id);
  }, 300);
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function startEditing(id) {
  const task = tasks.find((task) => task.id === id);
  if (!task) return;

  const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
  taskElement.innerHTML = `
        <div class="flex w-full items-center animate-fade-in">
            <input 
                type="text" 
                value="${task.text}"
                id="editInput-${id}"
                class="flex-grow px-4 py-2 border rounded-lg mr-2 focus:ring-2 focus:ring-blue-500"
            >
            <button 
                onclick="finishEditing(${id})"
                class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
            >
                <i class="fas fa-check mr-2"></i>Save
            </button>
            <button 
                onclick="renderTasks()"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg ml-2 transition"
            >
                <i class="fas fa-times mr-2"></i>Cancel
            </button>
        </div>
    `;
  document.getElementById(`editInput-${id}`).focus();
}

function finishEditing(id) {
  const newText = document.getElementById(`editInput-${id}`).value;
  editTask(id, newText);
}

function editTask(id, newText) {
  if (newText.trim()) {
    tasks = tasks.map((task) =>
      task.id === id ? { ...task, text: newText.trim() } : task
    );
    saveTasks();
    renderTasks();
  }
}

function filterTasks(filter) {
  currentFilter = filter;

  // Update button styles
  showAllBtn.className =
    "px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg shadow transition";
  showActiveBtn.className =
    "px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg shadow transition";
  showCompletedBtn.className =
    "px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg shadow transition";

  if (filter === "all") {
    showAllBtn.className =
      "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition";
  }
  if (filter === "active") {
    showActiveBtn.className =
      "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition";
  }
  if (filter === "completed") {
    showCompletedBtn.className =
      "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition";
  }

  renderTasks();
}

// Initialize
renderTasks();
