const GAMES = [
    { 
        id: '2d-football', 
        name: 'Pro Striker 2D', 
        icon: '⚽', 
        desc: 'Precision physics and fast-paced 2-player arcade football mechanics.',
        path: 'games/2D-Football/index.html'
    },
    { 
        id: 'flappy-bird', 
        name: 'Aero Dodge', 
        icon: '🐦', 
        desc: 'A meticulously responsive re-imagining of the classic tap-to-fly genre.',
        path: 'games/Flappy-Bird/index.html'
    },
    { 
        id: 'minecraft-3d', 
        name: 'Voxel Builder 3D', 
        icon: '🧊', 
        desc: 'Explore, place, and destroy in a fully realized in-browser 3D environment.',
        path: 'games/Minecraft-3D/index.html'
    }
];

// DOM Elements
const gameGrid = document.getElementById('gameGrid');
const homePage = document.getElementById('homePage');
const gamePage = document.getElementById('gamePage');
const gameFrame = document.getElementById('gameFrame');
const gameTitleDisplay = document.getElementById('gameTitleDisplay');
const backHomeBtn = document.getElementById('backHomeBtn');
const themeToggle = document.getElementById('themeToggle');
const htmlEl = document.documentElement;

// Theme Initialization
const savedTheme = localStorage.getItem('arcadeTheme') || 'dark';
htmlEl.setAttribute('data-theme', savedTheme);
updateThemeUI(savedTheme);

// Theme Toggle Logic
themeToggle.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('arcadeTheme', newTheme);
    updateThemeUI(newTheme);
});

function updateThemeUI(theme) {
    const icon = themeToggle.querySelector('.theme-icon');
    const text = themeToggle.querySelector('.theme-text');
    if (theme === 'dark') {
        icon.textContent = '☀️';
        text.textContent = 'Light Mode';
    } else {
        icon.textContent = '🌙';
        text.textContent = 'Dark Mode';
    }
}

// Render the Showcase Grid
function renderHub() {
    gameGrid.innerHTML = '';
    GAMES.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <span class="icon-emoji">${game.icon}</span>
            <div class="name">${game.name}</div>
            <div class="desc">${game.desc}</div>
        `;
        card.addEventListener('click', () => launchGame(game));
        gameGrid.appendChild(card);
    });
}

// Game Launch & Exit Logic
function launchGame(game) {
    gameTitleDisplay.textContent = game.name;
    gameFrame.src = game.path;
    
    // Cross-fade transition
    homePage.style.opacity = '0';
    setTimeout(() => {
        homePage.classList.remove('active');
        homePage.classList.add('hidden');
        
        gamePage.classList.remove('hidden');
        gamePage.classList.add('active');
        gameFrame.focus();
        homePage.style.opacity = '1';
    }, 300);
}

function closeGame() {
    gameFrame.src = ''; 
    gamePage.classList.remove('active');
    gamePage.classList.add('hidden');
    homePage.classList.remove('hidden');
    homePage.classList.add('active');
}

backHomeBtn.addEventListener('click', closeGame);

// Start
renderHub();