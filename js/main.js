/* =====================================================
   GAMING ODYSSEY
   MAIN APPLICATION
===================================================== */


/* =====================================================
   GAME DATABASE

   ADD FUTURE GAMES HERE
===================================================== */

const GAMES = [

    {
        id: "2d-football",

        name: "Pro Striker 2D",

        category: "Sports",

        icon: "⚽",

        description:
            "Fast-paced 2-player arcade football with physics, passing and powerful shots.",

        path:
            "games/2D-Football/index.html"
    },


    {
        id: "flappy-bird",

        name: "Aero Dodge",

        category: "Arcade",

        icon: "🐦",

        description:
            "A responsive arcade challenge where every tap takes you closer to a new high score.",

        path:
            "games/Flappy-Bird/index.html"
    },


    {
        id: "minecraft-3d",

        name: "Voxel Builder 3D",

        category: "Sandbox",

        icon: "🧊",

        description:
            "Explore, build and destroy inside a growing 3D voxel world.",

        path:
            "games/Minecraft-3D/index.html"
    }

];


/* =====================================================
   DOM ELEMENTS
===================================================== */

const html =
    document.documentElement;


const gameGrid =
    document.getElementById("gameGrid");


const gameSearch =
    document.getElementById("gameSearch");


const categoryFilters =
    document.getElementById("categoryFilters");


const noGames =
    document.getElementById("noGames");


const gameCount =
    document.getElementById("gameCount");


const featuredGame =
    document.getElementById("featuredGame");


const gamePlayerPage =
    document.getElementById("gamePlayerPage");


const gameFrame =
    document.getElementById("gameFrame");


const gameTitleDisplay =
    document.getElementById("gameTitleDisplay");


const backToGames =
    document.getElementById("backToGames");


const fullscreenButton =
    document.getElementById("fullscreenButton");


const mobileMenuButton =
    document.getElementById("mobileMenuButton");


const mobileNav =
    document.getElementById("mobileNav");


const themeToggle =
    document.getElementById("themeToggle");


const themeIcon =
    document.getElementById("themeIcon");


const contactForm =
    document.getElementById("contactForm");


const formMessage =
    document.getElementById("formMessage");


/* =====================================================
   STATE
===================================================== */

let currentCategory =
    "All";


let currentSearch =
    "";


/* =====================================================
   THEME
===================================================== */

function loadTheme() {

    const savedTheme =
        localStorage.getItem("gamingOdysseyTheme")
        || "dark";

    html.setAttribute(
        "data-theme",
        savedTheme
    );

    updateThemeIcon(
        savedTheme
    );

}


function updateThemeIcon(theme) {

    themeIcon.textContent =
        theme === "dark"
            ? "☀️"
            : "🌙";

}


themeToggle.addEventListener(
    "click",
    () => {

        const currentTheme =
            html.getAttribute(
                "data-theme"
            );


        const newTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";


        html.setAttribute(
            "data-theme",
            newTheme
        );


        localStorage.setItem(
            "gamingOdysseyTheme",
            newTheme
        );


        updateThemeIcon(
            newTheme
        );

    }
);


/* =====================================================
   PAGE NAVIGATION
===================================================== */

const pages =
    document.querySelectorAll(
        ".page"
    );


const navLinks =
    document.querySelectorAll(
        "[data-page]"
    );


function showPage(
    pageName
) {

    pages.forEach(
        page => {

            page.classList.remove(
                "active"
            );

        }
    );


    const target =
        document.querySelector(
            `[data-page-section="${pageName}"]`
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }


    navLinks.forEach(
        link => {

            link.classList.toggle(
                "active",
                link.dataset.page === pageName
            );

        }
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );


    mobileNav.classList.remove(
        "open"
    );

}


function handleRoute() {

    let route =
        window.location.hash
        .replace(
            "#",
            ""
        );


    if (
        !route ||
        ![
            "home",
            "games",
            "about",
            "contact"
        ].includes(route)
    ) {

        route =
            "home";

    }


    showPage(
        route
    );

}


window.addEventListener(
    "hashchange",
    handleRoute
);


/* =====================================================
   MOBILE MENU
===================================================== */

mobileMenuButton.addEventListener(
    "click",
    () => {

        mobileNav.classList.toggle(
            "open"
        );

    }
);


/* =====================================================
   GAME CATEGORIES
===================================================== */

function createCategories() {

    const categories = [

        "All",

        ...new Set(
            GAMES.map(
                game =>
                    game.category
            )
        )

    ];


    categoryFilters.innerHTML =
        "";


    categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "category-button";


            if (
                category ===
                currentCategory
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.textContent =
                category;


            button.addEventListener(
                "click",
                () => {

                    currentCategory =
                        category;


                    createCategories();

                    renderGames();

                }
            );


            categoryFilters.appendChild(
                button
            );

        }
    );

}


/* =====================================================
   RENDER GAMES
===================================================== */

function renderGames() {

    gameGrid.innerHTML =
        "";


    const filteredGames =
        GAMES.filter(
            game => {

                const matchesCategory =

                    currentCategory ===
                    "All"

                    ||

                    game.category ===
                    currentCategory;


                const searchText =

                    (
                        game.name
                        + " "
                        + game.description
                    )
                    .toLowerCase();


                const matchesSearch =

                    searchText.includes(
                        currentSearch
                        .toLowerCase()
                    );


                return (

                    matchesCategory
                    &&
                    matchesSearch

                );

            }
        );


    noGames.style.display =

        filteredGames.length === 0
            ? "block"
            : "none";


    filteredGames.forEach(
        game => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "game-card";


            card.innerHTML = `

                <div class="game-image">

                    <span class="game-category">
                        ${game.category}
                    </span>

                    ${game.icon}

                </div>


                <div class="game-info">

                    <h3>
                        ${game.name}
                    </h3>

                    <p>
                        ${game.description}
                    </p>

                    <button
                        class="play-button"
                    >
                        PLAY NOW →
                    </button>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    launchGame(
                        game
                    );

                }
            );


            gameGrid.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   SEARCH
===================================================== */

gameSearch.addEventListener(
    "input",
    event => {

        currentSearch =
            event.target.value;


        renderGames();

    }
);


/* =====================================================
   FEATURED GAME
===================================================== */

function renderFeaturedGame() {

    const game =
        GAMES[0];


    if (!game) {

        return;

    }


    featuredGame.innerHTML = `

        <div class="featured-info">

            <span class="eyebrow">
                CURRENTLY FEATURED
            </span>

            <h3>
                ${game.name}
            </h3>

            <p>
                ${game.description}
            </p>

            <br>

            <button
                class="primary-button"
                id="featuredPlay"
            >

                PLAY NOW
                →

            </button>

        </div>


        <div class="featured-icon">

            ${game.icon}

        </div>

    `;


    document
        .getElementById(
            "featuredPlay"
        )
        .addEventListener(
            "click",
            () => {

                launchGame(
                    game
                );

            }
        );

}


/* =====================================================
   LAUNCH GAME
===================================================== */

function launchGame(
    game
) {

    gameTitleDisplay.textContent =
        game.name;


    gameFrame.src =
        game.path;


    gamePlayerPage.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE GAME
===================================================== */

function closeGame() {

    gameFrame.src =
        "";


    gamePlayerPage.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";


    window.location.hash =
        "games";

}


backToGames.addEventListener(
    "click",
    closeGame
);


/* =====================================================
   FULLSCREEN
===================================================== */

fullscreenButton.addEventListener(
    "click",
    () => {

        if (
            !document.fullscreenElement
        ) {

            gamePlayerPage
                .requestFullscreen()
                .catch(
                    () => {}
                );

        }

        else {

            document.exitFullscreen();

        }

    }
);


/* =====================================================
   CONTACT FORM
===================================================== */

contactForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        formMessage.textContent =

            "Thanks! Your message has been received. 🚀";


        contactForm.reset();

    }
);


/* =====================================================
   GAME COUNT
===================================================== */

gameCount.textContent =
    GAMES.length;


/* =====================================================
   INITIALIZATION
===================================================== */

loadTheme();

createCategories();

renderGames();

renderFeaturedGame();

handleRoute();
