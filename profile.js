document.addEventListener('DOMContentLoaded', () => {
    // --- Selectors ---
    const profileUsername = document.getElementById('profileUsername');
    const profileSocialsDisplay = document.getElementById('profileSocialsDisplay');
    const profilePicture = document.getElementById('profilePicture');
    const defaultProfileAvatar = document.getElementById('defaultProfileAvatar');
    const profilePictureInput = document.getElementById('profilePictureInput');
    const bioTextarea = document.getElementById('bioTextarea');
    const totalTasksStat = document.getElementById('totalTasksStat');
    const editProfileForm = document.getElementById('editProfileForm');
    const usernameInput = document.getElementById('usernameInput');
    const linkedinInput = document.getElementById('linkedinInput');
    const githubInput = document.getElementById('githubInput');
    const portfolioInput = document.getElementById('portfolioInput');

    const PROFILE_DATA_KEY = 'dev-profile-data';
    const TASKS_DATA_KEY = 'devfocus-tasks';

    // --- State ---
    let profileData = JSON.parse(localStorage.getItem(PROFILE_DATA_KEY)) || {
        username: 'Developer',
        bio: '',
        picture: null,
        socials: {
            linkedin: '',
            github: '',
            portfolio: ''
        },
    };

    // --- Functions ---
    const saveProfileData = () => {
        localStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(profileData));
    };

    const renderProfile = () => {
        // Header
        profileUsername.textContent = profileData.username;

        // Profile Picture
        if (profileData.picture) {
            profilePicture.src = profileData.picture;
            profilePicture.style.display = 'block';
            defaultProfileAvatar.style.display = 'none';
        } else {
            profilePicture.style.display = 'none';
            defaultProfileAvatar.style.display = 'flex';
            // Get first letter of the first name
            const initial = profileData.username.trim().split(' ')[0][0] || '?';
            defaultProfileAvatar.textContent = initial.toUpperCase();
        }


        // Socials Display
        profileSocialsDisplay.innerHTML = '';
        if (profileData.socials.linkedin) {
            profileSocialsDisplay.innerHTML += `<a href="${profileData.socials.linkedin}" target="_blank" title="LinkedIn"><i class="fab fa-linkedin"></i></a>`;
        }
        if (profileData.socials.github) {
            profileSocialsDisplay.innerHTML += `<a href="${profileData.socials.github}" target="_blank" title="GitHub"><i class="fab fa-github"></i></a>`;
        }
        if (profileData.socials.portfolio) {
            profileSocialsDisplay.innerHTML += `<a href="${profileData.socials.portfolio}" target="_blank" title="Portfolio"><i class="fas fa-globe"></i></a>`;
        }

        // Form Inputs
        usernameInput.value = profileData.username;
        bioTextarea.value = profileData.bio;
        linkedinInput.value = profileData.socials.linkedin;
        githubInput.value = profileData.socials.github;
        portfolioInput.value = profileData.socials.portfolio;
    };

    const loadStats = () => {
        const tasks = JSON.parse(localStorage.getItem(TASKS_DATA_KEY)) || [];
        const completedTasksCount = tasks.filter(task => task.completed).length;
        totalTasksStat.textContent = completedTasksCount;
    };

    // --- Event Listeners ---
    editProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        profileData.username = usernameInput.value.trim();
        profileData.socials.linkedin = linkedinInput.value.trim();
        profileData.socials.github = githubInput.value.trim();
        profileData.socials.portfolio = portfolioInput.value.trim();
        saveProfileData();
        renderProfile();
        alert('Profile updated!');
    });

    bioTextarea.addEventListener('blur', () => {
        profileData.bio = bioTextarea.value;
        saveProfileData();
    });

    profilePictureInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            profileData.picture = event.target.result;
            saveProfileData();
            renderProfile();
        };
        reader.readAsDataURL(file);
    });

    // --- Initial Load ---
    renderProfile();
    loadStats();
});