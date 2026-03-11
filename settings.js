document.addEventListener('DOMContentLoaded', () => {
    // --- Selectors ---
    const themeSwitcher = document.querySelector('.theme-switcher');
    const showNotesToggle = document.getElementById('showNotesToggle');
    const showResourcesToggle = document.getElementById('showResourcesToggle');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const resetDataBtn = document.getElementById('resetDataBtn');

    // --- State ---
    let settings = JSON.parse(localStorage.getItem('devfocus-settings')) || {};

    // --- Functions ---
    const saveSettings = () => {
        localStorage.setItem('devfocus-settings', JSON.stringify(settings));
    };

    const applyTheme = (themeName) => {
        document.documentElement.setAttribute('data-theme', themeName);
        settings.theme = themeName;
        saveSettings();
        // Update active class on theme previews
        document.querySelectorAll('.theme-preview').forEach(preview => {
            preview.classList.toggle('active', preview.dataset.theme === themeName);
        });
    };

    const loadSettings = () => {
        // Theme
        const currentTheme = settings.theme || 'midnight'; // Default to midnight
        applyTheme(currentTheme);

        // Layout - Default to true if the setting is not explicitly false
        showNotesToggle.checked = settings.showNotes !== false;
        showResourcesToggle.checked = settings.showResources !== false;
    };

    // --- Event Listeners ---
    themeSwitcher.addEventListener('click', (e) => {
        const themePreview = e.target.closest('.theme-preview');
        if (themePreview) {
            applyTheme(themePreview.dataset.theme);
        }
    });

    showNotesToggle.addEventListener('change', (e) => {
        settings.showNotes = e.target.checked;
        saveSettings();
    });

    showResourcesToggle.addEventListener('change', (e) => {
        settings.showResources = e.target.checked;
        saveSettings();
    });

    exportDataBtn.addEventListener('click', () => {
        const dataToExport = {
            settings: JSON.parse(localStorage.getItem('devfocus-settings')) || {},
            tasks: JSON.parse(localStorage.getItem('devfocus-tasks')) || [],
            resources: JSON.parse(localStorage.getItem('devfocus-resources')) || [],
            profile: JSON.parse(localStorage.getItem('dev-profile-data')) || {},
            notes: localStorage.getItem('devfocus-notes') || '',
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `devfocus-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    resetDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset ALL data? This action cannot be undone.')) {
            localStorage.removeItem('devfocus-settings');
            localStorage.removeItem('devfocus-tasks');
            localStorage.removeItem('devfocus-resources');
            localStorage.removeItem('devfocus-notes');
            localStorage.removeItem('dev-profile-data');
            alert('All data has been reset. The page will now reload.');
            window.location.reload();
        }
    });

    // --- Initial Load ---
    loadSettings();
});