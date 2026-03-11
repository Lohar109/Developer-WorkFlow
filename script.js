document.addEventListener('DOMContentLoaded', () => {
    // --- Global Settings Applicator ---
    const settings = JSON.parse(localStorage.getItem('devfocus-settings')) || {};
    
    // Apply Username from profile data
    const profileData = JSON.parse(localStorage.getItem('dev-profile-data')) || {};
    const welcomeHeader = document.getElementById('welcomeHeader');
    if (welcomeHeader) {
        welcomeHeader.textContent = `Welcome, ${profileData.username || 'Developer'}!`;
    }
    const headerProfilePic = document.getElementById('headerProfilePic');
    if (headerProfilePic) {
        if (profileData.picture) {
            headerProfilePic.innerHTML = `<img src="${profileData.picture}" alt="Profile Pic">`;
        } else {
            const initial = (profileData.username || 'D').trim().split(' ')[0][0];
            headerProfilePic.textContent = initial.toUpperCase();
        }
    }

    // --- Element Selectors ---
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const taskList = document.getElementById('taskList');
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const pendingTaskList = document.getElementById('pendingTaskList');

    const resourceForm = document.getElementById('resourceForm');
    const resourceTitleInput = document.getElementById('resourceTitleInput');
    const resourceUrlInput = document.getElementById('resourceUrlInput');
    const resourceList = document.getElementById('resourceList');

    const notesCard = document.querySelector('.card-notes');
    const resourcesCard = document.querySelector('.card-resources');

    const notesArea = document.getElementById('notesArea');

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // --- State Management ---
    let tasks = JSON.parse(localStorage.getItem('devfocus-tasks')) || [];
    let resources = JSON.parse(localStorage.getItem('devfocus-resources')) || [];
    let notes = localStorage.getItem('devfocus-notes') || '';

    // --- Generic Save Function ---
    const saveData = () => {
        localStorage.setItem('devfocus-tasks', JSON.stringify(tasks));
        localStorage.setItem('devfocus-resources', JSON.stringify(resources));
        localStorage.setItem('devfocus-notes', notes);
    };

    // --- Task Functions ---
    const renderTasks = () => {
        taskList.innerHTML = '';

        // Create a sorted copy for rendering to keep pending tasks on top
        const sortedTasks = [...tasks].sort((a, b) => a.completed - b.completed);

        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = task.completed ? 'completed' : '';
            li.dataset.id = task.id;
            
            let fileAttachmentHTML = '';
            if (task.file) {
                fileAttachmentHTML = `<a href="${task.file.dataUrl}" download="${task.file.name}" class="file-attachment-link" title="${task.file.name}">📄</a>`;
            }

            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span>${task.text}</span>
                    ${fileAttachmentHTML}
                </div>
                <button class="delete-btn">×</button>
            `;
            taskList.appendChild(li);
        });

        updateProgress();
        renderPendingTasks();
    };

    const renderPendingTasks = () => {
        pendingTaskList.innerHTML = '';
        const pending = tasks.filter(task => !task.completed);

        if (pending.length === 0) {
            pendingTaskList.innerHTML = '<li class="placeholder-message">All tasks completed! 🎉</li>';
            return;
        }

        pending.forEach(task => {
            const li = document.createElement('li');
            li.dataset.id = task.id;
            li.innerHTML = `
                <span>${task.text}</span>
                <button class="delete-btn">×</button>
            `;
            pendingTaskList.appendChild(li);
        });
    };

    const addTask = (text, fileData) => {
        if (text.trim() === '') return;
        const newTask = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
            completedAt: null,
            file: fileData // Can be null
        };
        tasks.push(newTask);
        saveData();
        renderTasks();
    };

    const toggleTask = (id) => {
        tasks = tasks.map(task => {
            if (task.id === id) {
                const isCompleted = !task.completed;
                return { 
                    ...task, 
                    completed: isCompleted,
                    completedAt: isCompleted ? new Date().toISOString() : null
                };
            }
            return task;
        });
        saveData();
        renderTasks();
    };

    const deleteTask = (id) => {
        tasks = tasks.filter(task => task.id !== id);
        saveData();
        renderTasks();
    };

    // --- Resource Functions ---
    const renderResources = () => {
        resourceList.innerHTML = '';
        resources.forEach(resource => {
            const li = document.createElement('li');
            li.dataset.id = resource.id;
            li.innerHTML = `
                <a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="file-link">${resource.title}</a>
                <button class="delete-btn">×</button>
            `;
            resourceList.appendChild(li);
        });
    };

    const addResource = (title, url) => {
        if (title.trim() === '' || url.trim() === '') return;
        const newResource = {
            id: Date.now(),
            title: title.trim(),
            url: url.trim(),
            createdAt: new Date().toISOString() // Add timestamp for new resources
        };
        resources.push(newResource);
        saveData();
        renderResources();
    };

    const deleteResource = (id) => {
        resources = resources.filter(resource => resource.id !== id);
        saveData();
        renderResources();
    };

    // --- Progress Bar Function ---
    const updateProgress = () => {
        if (tasks.length === 0) {
            progressBar.style.width = '0%';
            progressText.textContent = 'No tasks yet. Add one!';
            return;
        }
        const completedTasks = tasks.filter(task => task.completed).length;
        const percentage = Math.round((completedTasks / tasks.length) * 100);
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}% Complete (${completedTasks}/${tasks.length})`;
    };

    // --- Event Listeners ---
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = taskInput.value;
        const file = fileInput.files[0];

        const resetForm = () => {
            taskInput.value = '';
            fileInput.value = ''; // Clears file selection
            fileNameDisplay.textContent = '';
            fileNameDisplay.style.display = 'none';
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = { name: file.name, dataUrl: e.target.result };
                addTask(taskText, fileData);
                resetForm();
            };
            reader.readAsDataURL(file);
        } else {
            addTask(taskText, null);
            resetForm();
        }
    });

    fileInput.addEventListener('change', () => {
        fileNameDisplay.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : '';
        fileNameDisplay.style.display = fileInput.files.length > 0 ? 'block' : 'none';
    });

    taskList.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('li').dataset.id);
        if (e.target.type === 'checkbox') {
            toggleTask(id);
        }
        if (e.target.classList.contains('delete-btn')) {
            deleteTask(id);
        }
    });

    pendingTaskList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.closest('li').dataset.id);
            deleteTask(id);
        }
    });

    resourceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addResource(resourceTitleInput.value, resourceUrlInput.value);
        resourceTitleInput.value = '';
        resourceUrlInput.value = '';
    });

    resourceList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.closest('li').dataset.id);
            deleteResource(id);
        }
    });

    notesArea.addEventListener('input', (e) => {
        notes = e.target.value;
        saveData();
    });

    // --- Initial Load ---
    const init = () => {
        // Apply Layout Settings. Default to true if the setting is not explicitly false.
        if (notesCard) {
            notesCard.classList.toggle('hidden', settings.showNotes === false);
        }
        if (resourcesCard) {
            resourcesCard.classList.toggle('hidden', settings.showResources === false);
        }

        notesArea.value = notes;
        renderTasks();
        renderResources();
    };

    init();
});
