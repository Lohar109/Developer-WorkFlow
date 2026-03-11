document.addEventListener('DOMContentLoaded', () => {
    // --- Global Settings Applicator ---
    // Get the computed accent color after the theme has been applied
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
    const hexToRgba = (hex, alpha = 1) => {
        // Handle non-hex colors gracefully
        if (!hex.startsWith('#')) return hex; 
        const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
        return `rgba(${r},${g},${b},${alpha})`;
    };
    // --- Element Selectors ---
    const totalTasksStat = document.getElementById('totalTasksStat');
    const streakStat = document.getElementById('streakStat');
    const hoursStat = document.getElementById('hoursStat');
    const weeklyCtx = document.getElementById('weeklyChart');
    const recentTasksList = document.getElementById('recentTasksList');
    const analyticsResourceList = document.getElementById('analyticsResourceList');
    const analyticsFileList = document.getElementById('analyticsFileList');
    const datePicker = document.getElementById('datePicker');
    const linksForDateCard = document.getElementById('linksForDateCard');
    const filesForDateCard = document.getElementById('filesForDateCard');
    const linksForDateList = document.getElementById('linksForDateList');
    const filesForDateList = document.getElementById('filesForDateList');
    const tasksForDateList = document.getElementById('tasksForDateList');
    
    // --- Load Data ---
    const tasks = JSON.parse(localStorage.getItem('devfocus-tasks')) || [];
    const resources = JSON.parse(localStorage.getItem('devfocus-resources')) || [];
    const completedTasks = tasks.filter(task => task.completed && task.completedAt);

    // --- Helper Functions ---
    const isSameDay = (date1, date2) => 
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();

    // --- Statistics Calculation ---
    const calculateStats = () => {
        // 1. Total Tasks & Hours
        const totalTasksDone = completedTasks.length;
        const learningHours = totalTasksDone; // 1 task = 1 hour

        // 3. Current Streak
        const completionDates = [...new Set(completedTasks.map(t => t.completedAt.split('T')[0]))]
            .map(d => new Date(d))
            .sort((a, b) => b - a);
        
        let currentStreak = 0;
        if (completionDates.length > 0) {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (isSameDay(completionDates[0], today) || isSameDay(completionDates[0], yesterday)) {
                currentStreak = 1;
                for (let i = 0; i < completionDates.length - 1; i++) {
                    const currentDay = completionDates[i];
                    const nextDay = completionDates[i+1];
                    const expectedNextDay = new Date(currentDay);
                    expectedNextDay.setDate(expectedNextDay.getDate() - 1);
                    if (isSameDay(nextDay, expectedNextDay)) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
        }

        return { totalTasksDone, learningHours, currentStreak };
    };

    // --- Render Functions ---
    const renderStats = ({ totalTasksDone, learningHours, currentStreak }) => {
        totalTasksStat.textContent = totalTasksDone;
        hoursStat.textContent = learningHours;
        streakStat.textContent = `${currentStreak} Day${currentStreak !== 1 ? 's' : ''}`;
    };

    const renderCharts = () => {
        // Chart.js Global Config
        Chart.defaults.color = '#8b949e';
        Chart.defaults.font.family = "'Space Grotesk', sans-serif";

        // 1. Weekly Productivity Bar Chart
        const weeklyLabels = [];
        const weeklyData = new Array(7).fill(0);
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            weeklyLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            completedTasks.forEach(task => {
                if (isSameDay(new Date(task.completedAt), date)) {
                    weeklyData[6 - i]++;
                }
            });
        }
        new Chart(weeklyCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: weeklyLabels,
                datasets: [{
                    label: 'Tasks Completed',
                    data: weeklyData,
                    backgroundColor: hexToRgba(accentColor, 0.6),
                    borderColor: hexToRgba(accentColor, 1),
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: { scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { color: 'rgba(255,255,255,0.1)' } } } }
        });
    };

    const renderRecentTasks = () => {
        recentTasksList.innerHTML = '';
        const sortedTasks = [...completedTasks].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        const tasksToDisplay = sortedTasks.slice(0, 7); // Show latest 7

        if (tasksToDisplay.length === 0) {
            recentTasksList.innerHTML = '<li>No tasks completed yet.</li>';
            return;
        }

        tasksToDisplay.forEach(task => {
            const li = document.createElement('li');
            const completionDate = new Date(task.completedAt).toLocaleDateString();
            li.innerHTML = `
                <span>${task.text}</span>
                <span class="completion-date">${completionDate}</span>
            `;
            recentTasksList.appendChild(li);
        });
    };

    const renderAnalyticsAttachments = () => {
        // Render Resource Links
        analyticsResourceList.innerHTML = '';
        if (resources.length === 0) {
            analyticsResourceList.innerHTML = '<li class="placeholder-message">No resource links saved.</li>';
        } else {
            resources.forEach(resource => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="file-link">${resource.title}</a>`;
                analyticsResourceList.appendChild(li);
            });
        }

        // Render Uploaded Files
        analyticsFileList.innerHTML = '';
        const tasksWithFiles = tasks.filter(task => task.file);
        if (tasksWithFiles.length === 0) {
            analyticsFileList.innerHTML = '<li class="placeholder-message">No files attached to tasks.</li>';
        } else {
            tasksWithFiles.forEach(task => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <a href="${task.file.dataUrl}" download="${task.file.name}" class="file-link">${task.file.name}</a>
                    <span class="file-task-context">for: "${task.text}"</span>
                `;
                analyticsFileList.appendChild(li);
            });
        }
    };

    // --- Event Listener for Date Picker ---
    const handleDateChange = (e) => {
        const selectedDateValue = e.target.value;

        // Hide section and clear lists if no date is selected
        if (!selectedDateValue) {
            tasksForDateList.innerHTML = '<li class="placeholder-message">Select a date above.</li>';
            linksForDateCard.style.display = 'none';
            filesForDateCard.style.display = 'none';
            return;
        }

        // Show the attachments section now that a date is selected
        linksForDateCard.style.display = 'block';
        filesForDateCard.style.display = 'block';

        // Adding 'T00:00:00' ensures the date is parsed in the user's local timezone
        const selectedDate = new Date(selectedDateValue + 'T00:00:00');

        // 1. Find and render completed tasks
        const tasksOnDate = completedTasks.filter(task => {
            const completionDate = new Date(task.completedAt);
            return isSameDay(completionDate, selectedDate);
        });

        tasksForDateList.innerHTML = ''; // Clear previous results
        const headerLi = document.createElement('li');
        headerLi.className = 'list-header';
        headerLi.innerHTML = `<strong>${tasksOnDate.length}</strong> tasks completed on ${selectedDate.toLocaleDateString()}`;
        tasksForDateList.appendChild(headerLi);

        if (tasksOnDate.length > 0) {
            tasksOnDate.forEach(task => {
                const li = document.createElement('li');
                const completionTime = new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                li.innerHTML = `
                    <span>${task.text}</span>
                    <span class="completion-date">at ${completionTime}</span>
                `;
                tasksForDateList.appendChild(li);
            });
        }

        // 2. Find and render resources added on this date
        const resourcesOnDate = resources.filter(resource => {
            if (!resource.createdAt) return false; // For old data without a timestamp
            return isSameDay(new Date(resource.createdAt), selectedDate);
        });

        linksForDateList.innerHTML = '';
        if (resourcesOnDate.length > 0) {
            resourcesOnDate.forEach(resource => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="file-link">${resource.title}</a>`;
                linksForDateList.appendChild(li);
            });
        } else {
            linksForDateList.innerHTML = '<li class="placeholder-message">No links were added on this date.</li>';
        }

        // 3. Find and render files from tasks completed on this date
        const filesOnDate = tasksOnDate.filter(task => task.file);

        filesForDateList.innerHTML = '';
        if (filesOnDate.length > 0) {
            filesOnDate.forEach(task => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <a href="${task.file.dataUrl}" download="${task.file.name}" class="file-link">${task.file.name}</a>
                    <span class="file-task-context">from: "${task.text}"</span>
                `;
                filesForDateList.appendChild(li);
            });
        } else {
            filesForDateList.innerHTML = '<li class="placeholder-message">No files from tasks completed on this date.</li>';
        }
    };

    // --- Initial Load ---
    const init = () => {
        tasksForDateList.innerHTML = '<li class="placeholder-message">Select a date above.</li>';
        linksForDateCard.style.display = 'none'; // Hide initially
        filesForDateCard.style.display = 'none'; // Hide initially
        datePicker.addEventListener('change', handleDateChange);

        if (completedTasks.length === 0) {
            document.getElementById('chartsGrid').innerHTML = `<p class="widget-card" style="grid-column: 1 / -1;">No completed tasks yet. Finish some tasks on the dashboard to see your stats!</p>`;
            return;
        }
        const stats = calculateStats();
        renderStats(stats);
        renderCharts();
        renderRecentTasks();
        renderAnalyticsAttachments();
    };

    init();
});
