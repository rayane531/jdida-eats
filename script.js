/* =========================================================
   JDIDA EATS
   OSM RESTAURANTS + McDONALD'S MANUAL INFORMATION
   ========================================================= */


/* =========================================================
   SETTINGS
   ========================================================= */

const OVERPASS_URL =
    "/.netlify/functions/restaurants";

const EL_JADIDA_BBOX =
    "33.18,-8.55,33.29,-8.42";


/* =========================================================
   RESTAURANTS
   ========================================================= */

let restaurants = [];


/* =========================================================
   ELEMENTS
   ========================================================= */

const homePage =
    document.getElementById("homePage");

const restaurantPage =
    document.getElementById("restaurantPage");

const restaurantGrid =
    document.getElementById("restaurantGrid");

const searchInput =
    document.getElementById("searchInput");

const searchBtn =
    document.getElementById("searchBtn");

const resultCount =
    document.getElementById("resultCount");

const noResults =
    document.getElementById("noResults");

const filterBtn =
    document.getElementById("filterBtn");

const filterPanel =
    document.getElementById("filterPanel");

const closeFilter =
    document.getElementById("closeFilter");

const ratingFilter =
    document.getElementById("ratingFilter");

const openFilter =
    document.getElementById("openFilter");

const clearFilters =
    document.getElementById("clearFilters");

const applyFilters =
    document.getElementById("applyFilters");

const filterCount =
    document.getElementById("filterCount");

const resetSearch =
    document.getElementById("resetSearch");


/* =========================================================
   FILTER STATE
   ========================================================= */

let selectedCategory = "all";
let selectedPrice = "all";


/* =========================================================
   McDONALD'S MANUAL DATA
   ========================================================= */

const MCDONALDS_DATA = {

    name: "McDonald's",

    category: "Burger",

    rating: 3.6,

    reviews: 2253,

    price: "€€",

    location:
        "Avenue des Nations Unies, El Jadida, Morocco",
    

    phone:
        "06 77 42 30 81",

    website:
        "https://www.mcdonalds.ma/",

    menuUrl:
        "https://www.mcdonalds.ma/notre-menu",

    description:
        "McDonald's à El Jadida — burgers, poulet, nuggets, frites, desserts, boissons et McCafé.",

    hours: [

        ["Monday", "10:00 – 02:00"],

        ["Tuesday", "10:00 – 02:00"],

        ["Wednesday", "10:00 – 02:00"],

        ["Thursday", "10:00 – 02:00"],

        ["Friday", "10:00 – 03:00"],

        ["Saturday", "10:00 – 03:00"],

        ["Sunday", "10:00 – 02:00"]

    ],

    menu: [],

    image:
        window.location.origin +
        "/images/mcdonalds-logo.png"

};


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   NORMALIZE NAME
   ========================================================= */

function normalizeName(value) {

    return String(value || "")
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]/g, "");
}


/* =========================================================
   DETECT RESTAURANT
   ========================================================= */

function getTestRestaurantType(name) {

    const normalized =
        normalizeName(name);


    if (
        normalized.includes("mcdonald")
    ) {

        return "mcdonalds";
    }


    if (
        normalized === "kfc" ||
        normalized.includes("kfc")
    ) {

        return "kfc";
    }


    return null;
}


/* =========================================================
   CATEGORY
   ========================================================= */

function getCategory(type) {

    if (type === "mcdonalds") {

        return "Burger";
    }


    if (type === "kfc") {

        return "Restaurant";
    }


    return "Restaurant";
}


/* =========================================================
   PRICE
   ========================================================= */

function getPrice(tags) {

    const level =
        tags["price:level"];


    if (level) {

        const number =
            Number(level);


        if (number === 1) return "€";

        if (number === 2) return "€€";

        if (number === 3) return "€€€";

        if (number >= 4) return "€€€€";
    }


    return "—";
}


/* =========================================================
   COORDINATES
   ========================================================= */

function getCoordinates(element) {

    if (
        typeof element.lat === "number" &&
        typeof element.lon === "number"
    ) {

        return {

            lat: element.lat,

            lon: element.lon

        };
    }


    if (
        element.center &&
        typeof element.center.lat === "number" &&
        typeof element.center.lon === "number"
    ) {

        return {

            lat: element.center.lat,

            lon: element.center.lon

        };
    }


    return {

        lat: null,

        lon: null

    };
}


/* =========================================================
   OSM URL
   ========================================================= */

function getOSMUrl(element) {

    return `https://www.openstreetmap.org/${element.type}/${element.id}`;
}


/* =========================================================
   GOOGLE MAPS
   ========================================================= */

function getGoogleMapsUrl(restaurant) {

    if (
        restaurant.latitude !== null &&
        restaurant.longitude !== null
    ) {

        return `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`;

    }

    const query =
        encodeURIComponent(
            `${restaurant.name}, ${restaurant.location}`
        );

    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}


/* =========================================================
   OSM DESCRIPTION
   ========================================================= */

function getOSMDescription(tags) {

    if (tags.description) {

        return tags.description;
    }


    if (tags["description:en"]) {

        return tags["description:en"];
    }


    if (tags["description:fr"]) {

        return tags["description:fr"];
    }


    return "Restaurant à El Jadida.";
}


/* =========================================================
   OSM OPENING HOURS
   ========================================================= */

function getOpeningHours(tags) {

    const openingHours =
        tags.opening_hours;


    if (!openingHours) {

        return [

            ["Monday", "Not available"],

            ["Tuesday", "Not available"],

            ["Wednesday", "Not available"],

            ["Thursday", "Not available"],

            ["Friday", "Not available"],

            ["Saturday", "Not available"],

            ["Sunday", "Not available"]

        ];
    }


    return [

        ["Opening hours", openingHours]

    ];
}


/* =========================================================
   OPEN STATUS
   ========================================================= */

function getOpenStatus(tags) {

    const value = tags?.opening_hours;

    if (!value) {
        return null;
    }

    if (
        value === "24/7" ||
        value.toLowerCase() === "24 hours"
    ) {
        return true;
    }

    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();

    const dayNames = [
        "Su",
        "Mo",
        "Tu",
        "We",
        "Th",
        "Fr",
        "Sa"
    ];

    const today =
        dayNames[now.getDay()];

    const parts =
        value.split(";");

    for (const part of parts) {

        const section =
            part.trim();

        if (!section) {
            continue;
        }

        const pieces =
            section.split(/\s+/);

        if (pieces.length < 2) {
            continue;
        }

        const dayPart =
            pieces[0];

        const timePart =
            pieces[1];

        if (
            !dayPart.includes(today) &&
            !dayPart.includes("-")
        ) {
            continue;
        }

        const timeRanges =
            timePart.split(",");

        for (const rangeText of timeRanges) {

            const match =
                rangeText
                    .trim()
                    .match(
                        /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/
                    );

            if (!match) {
                continue;
            }

            const openHour =
                Number(match[1]);

            const openMinute =
                Number(match[2]);

            const closeHour =
                Number(match[3]);

            const closeMinute =
                Number(match[4]);

            const opening =
                openHour * 60 +
                openMinute;

            const closing =
                closeHour * 60 +
                closeMinute;


            /* NORMAL HOURS */

            if (closing > opening) {

                if (
                    currentMinutes >= opening &&
                    currentMinutes < closing
                ) {
                    return true;
                }

            }


            /* OVERNIGHT HOURS */

            else if (closing < opening) {

                if (
                    currentMinutes >= opening ||
                    currentMinutes < closing
                ) {
                    return true;
                }

            }

        }
    }

    return false;
}
/* =========================================================
   MANUAL HOURS STATUS
   ========================================================= */

function getManualOpenStatus(hours) {

    if (!hours || hours.length === 0) {
        return null;
    }

    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();

    /*
     * JavaScript:
     * Sunday = 0
     * Monday = 1
     * ...
     * Saturday = 6
     *
     * Our MCDONALDS_DATA starts:
     * Monday = 0
     */

    const todayIndex =
        (now.getDay() + 6) % 7;

    const todayHours =
        hours[todayIndex];

    if (!todayHours) {
        return null;
    }

    const timeText =
        todayHours[1];

    if (
        !timeText ||
        timeText.toLowerCase() === "closed"
    ) {
        return false;
    }

    const match =
        timeText.match(
            /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/
        );

    if (!match) {
        return null;
    }

    const openHour =
        Number(match[1]);

    const openMinute =
        Number(match[2]);

    const closeHour =
        Number(match[3]);

    const closeMinute =
        Number(match[4]);

    const opening =
        openHour * 60 +
        openMinute;

    const closing =
        closeHour * 60 +
        closeMinute;


    /* NORMAL HOURS */

    if (closing > opening) {

        return (
            currentMinutes >= opening &&
            currentMinutes < closing
        );

    }


    /* OVERNIGHT HOURS
       Example: 10:00 – 02:00 */

    if (closing < opening) {

        return (
            currentMinutes >= opening ||
            currentMinutes < closing
        );

    }


    return false;
}

/* =========================================================
   CONVERT OSM RESTAURANT
   ====== =================================================== */

function convertOSMRestaurant(element) {

    const tags = element.tags || {};

    const name =
        tags.name ||
        tags["name:fr"] ||
        tags["name:en"];

    if (!name) {
        return null;
    }

    const coordinates = getCoordinates(element);

    const type = getTestRestaurantType(name);
    if (type === "mcdonalds") {

    return {
        id: "mcdonalds-el-jadida",

        osmId: element.id,
        osmType: element.type,

        type: "mcdonalds",

        name: MCDONALDS_DATA.name,

        category: MCDONALDS_DATA.category,

        rating: MCDONALDS_DATA.rating,

        reviews: MCDONALDS_DATA.reviews,

        price: MCDONALDS_DATA.price,

        open: getManualOpenStatus(MCDONALDS_DATA.hours),

        location: MCDONALDS_DATA.location,

        phone: MCDONALDS_DATA.phone,

        website: MCDONALDS_DATA.website,

        menuUrl: MCDONALDS_DATA.menuUrl,

        email: "",

        description: MCDONALDS_DATA.description,

        image: MCDONALDS_DATA.image,

        latitude: coordinates.lat,

        longitude: coordinates.lon,

        hours: MCDONALDS_DATA.hours,

        menu: MCDONALDS_DATA.menu,

        osmUrl: getOSMUrl(element),

        mapsUrl: "",

        manual: true
    };
}

 let category = tags.cuisine || tags.amenity || "Restaurant";

category = String(category)
    .split(";")[0]
    .replace(/_/g, " ")
    .trim();

if (!category) {
    category = "Restaurant";
}

if (type === "mcdonalds") {
    category = "Burger";
}

if (type === "kfc") {
    category = "Chicken";
}
    return {

        id: `${element.type}-${element.id}`,

        osmId: element.id,

        osmType: element.type,

        type: type || "restaurant",

        name: name,

        category: category,

        rating: tags.rating
            ? Number(tags.rating)
            : null,

        reviews: tags["review_count"]
            ? Number(tags["review_count"])
            : null,

        price: getPrice(tags),

        open: getOpenStatus(tags),

        location:
    [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:postcode"],
        tags["addr:city"]
    ]
        .filter(Boolean)
        .join(", ") || "El Jadida, Morocco",

        phone:
            tags.phone ||
            tags["contact:phone"] ||
            "Not available",

        website:
            tags.website ||
            tags["contact:website"] ||
            "",

        menuUrl:
            tags["menu:url"] ||
            "",

        email:
            tags.email ||
            tags["contact:email"] ||
            "",

        description:
            getOSMDescription(tags),
        cuisine:
             tags.cuisine || "",

        image:
            type === "mcdonalds"
            ? window.location.origin +
            "/images/mcdonalds-logo.png"

            : type === "kfc"
            ? window.location.origin +
              "/images/kfc-logo1.png"

            : window.location.origin +
              "/images/restaurant-default.jpg", 

        latitude:
            coordinates.lat,

        longitude:
            coordinates.lon,

        hours:
            getOpeningHours(tags),

        menu: [],

        osmUrl:
            getOSMUrl(element),

        mapsUrl: "",

        manual: false

    };
}


/* =========================================================
   LOAD RESTAURANTS
   ========================================================= */

async function loadRestaurantsFromOpenStreetMap() {

    showLoadingState();


    const query = `

        [out:json][timeout:30];

        (

            nwr["amenity"="restaurant"](${EL_JADIDA_BBOX});

            nwr["amenity"="cafe"](${EL_JADIDA_BBOX});

            nwr["amenity"="fast_food"](${EL_JADIDA_BBOX});

            nwr["amenity"="food_court"](${EL_JADIDA_BBOX});

        );

        out center tags;

    `;


    try {

        const response =
            await fetch(

                OVERPASS_URL,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/x-www-form-urlencoded;charset=UTF-8"

                    },

                    body:
                        "data=" +
                        encodeURIComponent(query)

                }

            );


        if (!response.ok) {

            throw new Error(
                `Overpass HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        const converted =
            data.elements
                .map(convertOSMRestaurant)
                .filter(Boolean);


        const finalRestaurants = [];


        /* =================================================
           KEEP ALL RESTAURANTS
           ================================================= */

        converted.forEach(restaurant => {

            finalRestaurants.push(restaurant);

        });


        /* =================================================
           GOOGLE MAPS URL
           ================================================= */

        finalRestaurants.forEach(
            restaurant => {

                restaurant.mapsUrl =
                    getGoogleMapsUrl(
                        restaurant
                    );

            }
        );


        /* =================================================
           SORT
           McDonald's first, then KFC,
           then the rest alphabetically
           ================================================= */

        finalRestaurants.sort(
            (a, b) => {

                if (
                    a.type ===
                    "mcdonalds"
                ) {

                    return -1;
                }


                if (
                    b.type ===
                    "mcdonalds"
                ) {

                    return 1;
                }


                if (
                    a.type ===
                    "kfc"
                ) {

                    return -1;
                }


                if (
                    b.type ===
                    "kfc"
                ) {

                    return 1;
                }


                return a.name.localeCompare(
                    b.name
                );

            }
        );


        restaurants =
            finalRestaurants;


        updateResults();


    } catch (error) {

        console.error(
            "OpenStreetMap loading error:",
            error
        );


        showLoadingError();
    }
}


/* =========================================================
   LOADING STATE
   ========================================================= */

function showLoadingState() {

    if (!restaurantGrid) {

        return;
    }


    restaurantGrid.innerHTML = `

        <div style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 20px;
        ">

            <div style="
                font-size: 45px;
                margin-bottom: 15px;
            ">
                🍽️
            </div>

            <h3>
                Loading restaurants...
            </h3>

            <p>
                Chargement des restaurants
                à El Jadida.
            </p>

        </div>

    `;


    if (resultCount) {

        resultCount.textContent =
            "Loading...";
    }


    if (noResults) {

        noResults.classList.remove(
            "show"
        );
    }
}


/* =========================================================
   ERROR STATE
   ========================================================= */

function showLoadingError() {

    if (!restaurantGrid) {

        return;
    }


    restaurantGrid.innerHTML = `

        <div style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 20px;
        ">

            <div style="
                font-size: 45px;
                margin-bottom: 15px;
            ">
                ⚠️
            </div>

            <h3>
                Impossible de charger les restaurants
            </h3>

            <p>
                Vérifie ta connexion puis réessaie.
            </p>

            <button
                id="retryOSM"
                style="
                    margin-top: 15px;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                "
            >
                Réessayer
            </button>

        </div>

    `;


    if (resultCount) {

        resultCount.textContent =
            "Unable to load";
    }


    const retry =
        document.getElementById(
            "retryOSM"
        );


    if (retry) {

        retry.addEventListener(
            "click",
            loadRestaurantsFromOpenStreetMap
        );
    }
}


/* =========================================================
   RENDER RESTAURANTS
   ========================================================= */

function renderRestaurants(list) {

    if (!restaurantGrid) {

        return;
    }


    restaurantGrid.innerHTML =
        "";


    if (resultCount) {

        resultCount.textContent =
            `${list.length} restaurant${list.length !== 1 ? "s" : ""} found`;
    }


    if (list.length === 0) {

        if (noResults) {

            noResults.classList.add(
                "show"
            );
        }

        return;
    }


    if (noResults) {

        noResults.classList.remove(
            "show"
        );
    }


    list.forEach(
        restaurant => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "restaurant-card";


            const ratingHTML =
                restaurant.rating !== null

                    ? `

                        <span>★</span>

                        ${escapeHTML(
                            restaurant.rating
                        )}

                        ${
                            restaurant.reviews !== null

                                ? `

                                    <small>
                                        (${escapeHTML(
                                            restaurant.reviews
                                        )})
                                    </small>

                                `

                                : ""
                        }

                    `

                    : `

                        <span>★</span>

                        No rating

                    `;


            let statusHTML =
                "";


            if (
                restaurant.open === true
            ) {

                statusHTML = `

                    <span class="status open">
                        ● Open now
                    </span>

                `;

            } else if (
                restaurant.open === false
            ) {

                statusHTML = `

                    <span class="status closed">
                        ● Closed
                    </span>

                `;

            } else {

                statusHTML = `

                    <span class="status">
                        ● Hours available
                    </span>

                `;
            }


            const price =
                restaurant.price !== "—"
                    ? restaurant.price
                    : "";


            card.innerHTML = `

                <div class="restaurant-image">

                    ${
                        restaurant.image

                            ? `

                                <img
                                    src="${escapeHTML(
                                        restaurant.image
                                    )}"
                                    alt="${escapeHTML(
                                        restaurant.name
                                    )}"
                                    loading="lazy"
                                >

                            `

                            

                              : `
                               <img
                                src="images/restaurant-default.jpg"
                                alt="Restaurant"
                                loading="lazy"
                                             >
                                `
                    }


                    ${statusHTML}


                    ${
                        price

                            ? `

                                <span class="price-tag">
                                    ${escapeHTML(
                                        price
                                    )}
                                </span>

                            `

                            : ""
                    }

                </div>


                <div class="card-body">

                    <div class="card-category">
                        ${escapeHTML(
                            restaurant.category
                        )}
                    </div>


                    <h3 class="card-title">
                        ${escapeHTML(
                            restaurant.name
                        )}
                    </h3>


                    <p class="card-description">
                        ${escapeHTML(
                            restaurant.description
                        )}
                    </p>


                    <div class="card-bottom">

                        <div class="rating">
                            ${ratingHTML}
                        </div>


                        <div class="location">
                            📍
                            ${escapeHTML(
                                restaurant.location
                            )}
                        </div>

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    showRestaurantPage(
                        restaurant.id
                    );

                }
            );


            restaurantGrid.appendChild(
                card
            );

        }
    );
}


/* =========================================================
   FILTER
   ========================================================= */

function getFilteredRestaurants() {

    const search =
        searchInput

            ? searchInput.value
                .toLowerCase()
                .trim()

            : "";


    const minimumRating =
        ratingFilter

            ? Number(
                ratingFilter.value
            )

            : 0;


    return restaurants.filter(
        restaurant => {

            const searchableText = `

                ${restaurant.name}

                ${restaurant.category}

                ${restaurant.location}

                ${restaurant.description}

            `.toLowerCase();


            const matchesSearch =
                searchableText.includes(
                    search
                );


            const matchesCategory =
                selectedCategory === "all"

                ||

                restaurant.category ===
                    selectedCategory;


            const matchesRating =
                minimumRating === 0

                ||

                (
                    restaurant.rating !== null &&

                    restaurant.rating >=
                        minimumRating
                );


            const matchesPrice =
                selectedPrice === "all"

                ||

                restaurant.price ===
                    selectedPrice;


            const matchesOpen =
                !openFilter

                ||

                !openFilter.checked

                ||

                restaurant.open === true;


            return (

                matchesSearch &&

                matchesCategory &&

                matchesRating &&

                matchesPrice &&

                matchesOpen

            );

        }
    );
}


/* =========================================================
   UPDATE RESULTS
   ========================================================= */

function updateResults() {

    renderRestaurants(
        getFilteredRestaurants()
    );


    updateFilterCount();
}


/* =========================================================
   CATEGORY BUTTONS
   ========================================================= */

document
    .querySelectorAll(".category")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".category"
                        )
                        .forEach(
                            btn =>
                                btn.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    selectedCategory =
                        button.dataset.category ||
                        "all";


                    updateResults();

                }
            );

        }
    );


/* =========================================================
   PRICE BUTTONS
   ========================================================= */

document
    .querySelectorAll(".price-option")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".price-option"
                        )
                        .forEach(
                            btn =>
                                btn.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    selectedPrice =
                        button.dataset.price ||
                        "all";


                    updateResults();

                }
            );

        }
    );


/* =========================================================
   SEARCH
   ========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        updateResults
    );
}


if (searchBtn) {

    searchBtn.addEventListener(
        "click",
        () => {

            updateResults();


            const restaurantsSection =
                document.getElementById(
                    "restaurants"
                );


            if (restaurantsSection) {

                restaurantsSection.scrollIntoView({

                    behavior:
                        "smooth"

                });

            }

        }
    );
}


/* =========================================================
   FILTER PANEL
   ========================================================= */

if (filterBtn) {

    filterBtn.addEventListener(
        "click",
        () => {

            if (filterPanel) {

                filterPanel.classList.toggle(
                    "show"
                );

            }

        }
    );
}


if (closeFilter) {

    closeFilter.addEventListener(
        "click",
        () => {

            if (filterPanel) {

                filterPanel.classList.remove(
                    "show"
                );

            }

        }
    );
}


if (applyFilters) {

    applyFilters.addEventListener(
        "click",
        () => {

            updateResults();


            if (filterPanel) {

                filterPanel.classList.remove(
                    "show"
                );

            }

        }
    );
}


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

if (clearFilters) {

    clearFilters.addEventListener(
        "click",
        () => {

            if (ratingFilter) {

                ratingFilter.value =
                    "0";
            }


            if (openFilter) {

                openFilter.checked =
                    false;
            }


            selectedPrice =
                "all";


            document
                .querySelectorAll(
                    ".price-option"
                )
                .forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


            const allPrice =
                document.querySelector(
                    '[data-price="all"]'
                );


            if (allPrice) {

                allPrice.classList.add(
                    "active"
                );

            }


            updateResults();

        }
    );
}


/* =========================================================
   FILTER COUNT
   ========================================================= */

function updateFilterCount() {

    if (!filterCount) {

        return;
    }


    let count =
        0;


    if (
        ratingFilter &&
        ratingFilter.value !== "0"
    ) {

        count++;

    }


    if (
        openFilter &&
        openFilter.checked
    ) {

        count++;

    }


    if (
        selectedPrice !== "all"
    ) {

        count++;

    }


    if (count > 0) {

        filterCount.style.display =
            "flex";

        filterCount.textContent =
            count;

    } else {

        filterCount.style.display =
            "none";
    }
}


/* =========================================================
   RESET SEARCH
   ========================================================= */

if (resetSearch) {

    resetSearch.addEventListener(
        "click",
        () => {

            if (searchInput) {

                searchInput.value =
                    "";
            }


            selectedCategory =
                "all";


            selectedPrice =
                "all";


            if (ratingFilter) {

                ratingFilter.value =
                    "0";
            }


            if (openFilter) {

                openFilter.checked =
                    false;
            }


            document
                .querySelectorAll(
                    ".category"
                )
                .forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


            const allCategory =
                document.querySelector(
                    '[data-category="all"]'
                );


            if (allCategory) {

                allCategory.classList.add(
                    "active"
                );
            }


            document
                .querySelectorAll(
                    ".price-option"
                )
                .forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


            const allPrice =
                document.querySelector(
                    '[data-price="all"]'
                );


            if (allPrice) {

                allPrice.classList.add(
                    "active"
                );
            }


            updateResults();

        }
    );
}


/* =========================================================
   RESTAURANT DETAIL PAGE
   ========================================================= */

function showRestaurantPage(id) {

    const restaurant =
        restaurants.find(
            item =>
                item.id === id
        );


    if (!restaurant) {

        return;
    }


    const pageImage =
        document.getElementById(
            "pageImage"
        );


    if (pageImage) {

        if (restaurant.image) {

            pageImage.src =
                restaurant.image;

        } else {

            pageImage.removeAttribute(
                "src"
            );
        }


        pageImage.alt =
            restaurant.name;
    }


    const pageCategory =
        document.getElementById(
            "pageCategory"
        );


    if (pageCategory) {

        pageCategory.textContent =
            restaurant.category;
    }
    const pageCuisine =
    document.getElementById(
        "pageCuisine"
    );

    if (pageCuisine) {

    if (restaurant.cuisine) {

        pageCuisine.textContent =
            restaurant.cuisine;

        pageCuisine.style.display =
            "inline-block";

    } else {

        pageCuisine.style.display =
            "none";

    }
}

    const pageName =
        document.getElementById(
            "pageName"
        );


    if (pageName) {

        pageName.textContent =
            restaurant.name;
    }


    const pageRating =
        document.getElementById(
            "pageRating"
        );


    if (pageRating) {

        if (
            restaurant.rating !== null
        ) {

            pageRating.innerHTML = `

                ⭐ ${escapeHTML(
                    restaurant.rating
                )}

                ${
                    restaurant.reviews !== null

                        ? `

                            · ${escapeHTML(
                                restaurant.reviews
                            )} reviews

                        `

                        : ""
                }

            `;

        } else {

            pageRating.textContent =
                "⭐ Rating unavailable";
        }
    }


    const pageDescription =
        document.getElementById(
            "pageDescription"
        );


    if (pageDescription) {

        pageDescription.textContent =
            restaurant.description;
    }


    const pageLocation =
    document.getElementById("pageLocation");


    if (pageLocation) {

        pageLocation.textContent =
            restaurant.location;
    }


    const mapLocation =
        document.getElementById(
            "mapLocation"
        );


    if (mapLocation) {

        mapLocation.textContent =
            restaurant.location;
    }
     const restaurantMap =
    document.getElementById(
        "restaurantMap"
    );

    if (
    restaurantMap &&
    restaurant.latitude !== null &&
    restaurant.longitude !== null
   ) {

    restaurantMap.src =
        `https://www.openstreetmap.org/export/embed.html?bbox=` +
        `${restaurant.longitude - 0.003},` +
        `${restaurant.latitude - 0.003},` +
        `${restaurant.longitude + 0.003},` +
        `${restaurant.latitude + 0.003}` +
        `&layer=mapnik&marker=` +
        `${restaurant.latitude},${restaurant.longitude}`;

    }

    const pagePhone =
        document.getElementById(
            "pagePhone"
        );


    if (pagePhone) {

        pagePhone.textContent =
            restaurant.phone;
    }


    const pagePrice =
        document.getElementById(
            "pagePrice"
        );


    if (pagePrice) {

        pagePrice.textContent =
            restaurant.price;
    }


    const pageOpen =
        document.getElementById(
            "pageOpen"
        );


    if (pageOpen) {

        if (
            restaurant.open === true
        ) {

            pageOpen.textContent =
                "Open now";

            pageOpen.style.color =
                "#14833b";

        } else if (
            restaurant.open === false
        ) {

            pageOpen.textContent =
                "Closed";

            pageOpen.style.color =
                "#c62828";

        } else {

            pageOpen.textContent =
                "Hours available";

            pageOpen.style.color =
                "#777";
        }
    }


    const pageStatus =
        document.getElementById(
            "pageStatus"
        );


    if (pageStatus) {

        if (
            restaurant.open === true
        ) {

            pageStatus.textContent =
                "🟢 Open now";

        } else if (
            restaurant.open === false
        ) {

            pageStatus.textContent =
                "🔴 Closed";

        } else {

            pageStatus.textContent =
                "⚪ Hours available";
        }
    }


    const hoursList =
        document.getElementById(
            "hoursList"
        );


    if (hoursList) {

        hoursList.innerHTML =
            "";


        restaurant.hours.forEach(
            (day, index) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "hours-row";


                const today =
                    (
                        new Date().getDay() +
                        6
                    ) % 7;


                if (index === today) {

                    row.classList.add(
                        "today"
                    );
                }


                row.innerHTML = `

                    <span>
                        ${escapeHTML(
                            day[0]
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            day[1]
                        )}
                    </span>

                `;


                hoursList.appendChild(
                    row
                );

            }
        );
    }


    const menuGrid =
        document.getElementById(
            "menuGrid"
        );


    if (menuGrid) {

        menuGrid.innerHTML =
            "";


        if (
            restaurant.menuUrl
        ) {

            menuGrid.innerHTML += `

                <div style="
                    padding:20px;
                    text-align:center;
                ">

                    <p>
                        Consultez le menu
                        officiel de McDonald's Maroc.
                    </p>

                    <a
                        href="${escapeHTML(
                            restaurant.menuUrl
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                            display:inline-block;
                            margin-top:10px;
                            padding:12px 18px;
                            border-radius:10px;
                            text-decoration:none;
                        "
                    >
                        Voir le menu officiel
                    </a>

                </div>

            `;

        } else if (
            restaurant.menu.length === 0
        ) {

            menuGrid.innerHTML = `

                <div style="
                    padding:20px;
                    text-align:center;
                ">

                    Menu not available.

                </div>

            `;

        } else {

            restaurant.menu.forEach(
                item => {

                    const menuItem =
                        document.createElement(
                            "div"
                        );


                    menuItem.className =
                        "menu-item";


                    menuItem.innerHTML = `

                        <div>

                            <h3>
                                ${escapeHTML(
                                    item[0]
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    item[2]
                                )}
                            </p>

                        </div>


                        <span class="menu-price">
                            ${escapeHTML(
                                item[1]
                            )}
                        </span>

                    `;


                    menuGrid.appendChild(
                        menuItem
                    );

                }
            );
        }
    }


    const websiteButton =
        document.getElementById(
            "websiteButton"
        );


    if (websiteButton) {

        if (
            restaurant.website
        ) {

            websiteButton.style.display =
                "inline-flex";


            websiteButton.onclick =
                () => {

                    window.open(
                        restaurant.website,
                        "_blank"
                    );

                };

        } else {

            websiteButton.style.display =
                "none";
        }
    }


    const callButton =
    document.getElementById(
        "callButton"
    );


if (callButton) {

    const hasPhone =
        restaurant.phone &&
        restaurant.phone !== "Not available";


    if (hasPhone) {

        callButton.disabled = false;

        callButton.textContent =
            "📞 " + restaurant.phone;

        callButton.classList.remove(
            "unavailable"
        );

        callButton.onclick =
            () => {

                if (
                    /Android|iPhone|iPad|iPod/i.test(
                        navigator.userAgent
                    )
                ) {

                    window.location.href =
                        `tel:${restaurant.phone}`;

                } else {

                    alert(
                        "Phone number: " +
                        restaurant.phone
                    );

                }

            };

    } else {

        callButton.disabled = false;

        callButton.textContent =
            "📞 Phone number unavailable";

        callButton.classList.add(
            "unavailable"
        );

        callButton.onclick =
            () => {

                alert(
                    "This restaurant has not provided a phone number."
                );

            };

    }

}
    function openMaps() {

            window.open(
                restaurant.mapsUrl,
                "_blank"
            );

        }


    const directionButton =
        document.getElementById(
            "directionButton"
        );


    if (directionButton) {

        directionButton.onclick =
            openMaps;
    }


    const mapButton =
        document.getElementById(
            "mapButton"
        );


    if (mapButton) {

        mapButton.onclick =
            openMaps;
    }


    const osmSource =
        document.getElementById(
            "osmSource"
        );


    if (osmSource) {

        osmSource.innerHTML = `

            Data from

            <a
                href="${escapeHTML(
                    restaurant.osmUrl
                )}"
                target="_blank"
                rel="noopener"
            >
                OpenStreetMap
            </a>

        `;
    }


    if (homePage) {

        homePage.style.display =
            "none";
    }


    if (restaurantPage) {

        restaurantPage.classList.add(
            "show"
        );
    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });


    history.pushState(

        {
            restaurantId:
                restaurant.id
        },

        "",

        `?restaurant=${encodeURIComponent(
            restaurant.id
        )}`

    );
}


/* =========================================================
   BACK BUTTON
   ========================================================= */

const backButton =
    document.getElementById(
        "backButton"
    );


if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            if (restaurantPage) {

                restaurantPage.classList.remove(
                    "show"
                );
            }


            if (homePage) {

                homePage.style.display =
                    "block";
            }


            history.pushState(
                {},
                "",
                window.location.pathname
            );


            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }
    );
}


/* =========================================================
   BROWSER BACK
   ========================================================= */

window.addEventListener(
    "popstate",
    () => {

        if (restaurantPage) {

            restaurantPage.classList.remove(
                "show"
            );
        }


        if (homePage) {

            homePage.style.display =
                "block";
        }

    }
);


/* =========================================================
   START
   ========================================================= */

loadRestaurantsFromOpenStreetMap();