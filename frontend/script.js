document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('csvFile').addEventListener('change', handleFileUpload);
});

let allCards = [];
let selectedCards = [];
let columnsToDisplayIndexes = [];
const slotColors = {
    "QB": "#DA70D6",     
    "RB": "#50C878",     
    "WR": "#FFAC1C",     
    "TE": "#50A0C8",     
    "DEF": "#a833ff",    
    "K": "#ffc300",      
    "FLEX": "#00cccc",   
};

const rostershipColors = {
    high: "#33ff57",  // Red (High rostership)
    medium: "#ffc300", // Yellow (Medium rostership)
    low: "#ff5733" // Green (Low rostership)
};

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const contents = e.target.result;
        parseCSV(contents);
    };
    reader.readAsText(file);
}

function parseCSV(csvText) {
    const rows = csvText.split('\n').map(row => row.split(','));
    const headers = rows.shift().map(header => header.trim());

    const data = rows.map(row => {
        let obj = {};
        row.forEach((value, index) => {
            obj[headers[index]] = value.trim();
        });
        return obj;
    });

    // Store all cards
    allCards = data.filter(row => row["firstName"] && row["lastName"]); // Remove empty rows
    
    // Find column index for slotName
    const slotIndex = headers.indexOf("slotName");
    console.log(slotIndex)
    if (slotIndex === -1) {
        alert("slotName column not found!");
        return;
    }

    // Sort by rank, handle invalid ranks
    selectedCards = [...allCards].sort((a, b) => {
        const rankA = parseRank(a.rank);
        const rankB = parseRank(b.rank);
        return rankA - rankB;
    });

    // Create filter tabs for slotName (filter out empty or undefined values)
    createFilterTabs(slotIndex);

    // Display the cards after sorting and filtering
    displayCards();
}

function parseRank(rank) {
    // Handle rank parsing: if it's a valid number, return it; otherwise, return a large number for "N/A" values.
    const parsed = parseInt(rank);
    return isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed; // Non-numeric ranks will be sorted last
}

function createFilterTabs() {
    const filterContainer = document.getElementById("filterTabs");
    filterContainer.innerHTML = ""; // Clear existing filters

    // Get unique slotNames
    const uniqueSlots = [...new Set(allCards.map(card => card.slotName).filter(Boolean))];
    
    uniqueSlots.forEach(slot => {
        const button = document.createElement("button");
        button.textContent = slot;
        button.classList.add("filter-tab");

        // Apply color based on slotName
        const borderColor = slotColors[slot] || "#ccc"; // Default gray
        button.style.backgroundColor = borderColor;
        button.style.color = "#fff"; // Ensure text is visible

        button.addEventListener("click", () => {
            filterCards(slot);
        });

        filterContainer.appendChild(button);
    });

    // "All" button
    const allButton = document.createElement("button");
    allButton.textContent = "All";
    allButton.classList.add("filter-tab");
    allButton.style.backgroundColor = "#000"; // Default black for All
    allButton.style.color = "#fff";

    allButton.addEventListener("click", () => {
        displayCards();
    });

    filterContainer.appendChild(allButton);
}

function filterCards(slot) {
    const filteredData = allCards.filter(card => card.slotName === slot);
    displayCards(filteredData);
}

function filterTable(filterValue, slotIndex) {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active")); // Remove active class
    event.target.classList.add("active"); // Highlight selected tab

    // Filter the cards based on slotName
    const filteredData = filterValue ? allCards.filter(row => row.slotName && row.slotName.trim() === filterValue) : allCards;
    
    displayCards(filteredData);  // Pass the filtered data
}

function displayCards(filteredData = allCards) {
    const csvContainer = document.getElementById("csvTable");
    const selectedContainer = document.getElementById("selectedCards");

    csvContainer.innerHTML = "";
    selectedContainer.innerHTML = "";

    // Display filtered cards
    filteredData.forEach(row => {
        const card = createCard(row, isSelectedCard(row));
        csvContainer.appendChild(card);
    });

    // Filter selected cards to only show those with a valid rank value
    const validSelectedCards = selectedCards.filter(row => row.rank && row.rank.trim() !== ""); 

    validSelectedCards.forEach(row => {
        const card = createCard(row, true);
        selectedContainer.appendChild(card);
    });
}

// Helper function to check if the card is selected based on some unique key (e.g., `id`)
function isSelectedCard(row) {
    return selectedCards.some(selectedRow => selectedRow.firstName === row.firstName && selectedRow.lastName === row.lastName);  // Compare by `firstName` and `lastName`
}

function updateSelectedCards() {
    const selectedContainer = document.getElementById("selectedCards");
    selectedContainer.innerHTML = ""; // Clear before updating

    selectedCards.forEach(row => {
        const card = createCard(row, true);
        selectedContainer.appendChild(card);
    });
}

function updateCsvTableButton(row) {
    const csvContainer = document.getElementById("csvTable");
    const cards = csvContainer.getElementsByClassName("card");

    for (let card of cards) {
        const nameElement = card.querySelector(".name");
        if (nameElement && nameElement.textContent === `${row.firstName} ${row.lastName}`) {
            const button = card.querySelector(".toggle-button");
            button.innerHTML = isSelectedCard(row) ? "−" : "+"; // ✅ Dynamically update
            break;
        }
    }
}

function getRostershipColor(rostership) {
    const value = parseFloat(rostership.replace("%", "")); // Convert "65%" to 65
    if (isNaN(value)) return "#ccc"; // Default gray for invalid values

    if (value >= 20) return rostershipColors.high;    // High rostership
    if (value >= 7) return rostershipColors.medium;  // Medium rostership
    return rostershipColors.low;                      // Low rostership
}

function createCard(row, isSelected) {
    const card = document.createElement("div");
    card.classList.add("card");

    // Get the color based on slotName
    const borderColor = slotColors[row.slotName] || "#ccc"; // Default gray
    card.style.borderLeft = `5px solid ${borderColor}`;

    // Left section (Name + Position Rank)
    const leftSection = document.createElement("div");
    leftSection.classList.add("card-left");
    leftSection.innerHTML = `
        <div class="name">${row.firstName} ${row.lastName}</div>
        <div class="positionRank" style="background-color: ${borderColor}; color: #000000; padding: 2px 6px; border-radius: 4px; display: inline-block; width: 50px;">
            ${row.positionRank}
        </div>`;

    // Right section (ADP, Projected Points, and Rostership always visible)
    const rightSection = document.createElement("div");
    rightSection.classList.add("card-right");
    const rostershipValue = row.rostership || "0%"; // Default to 0% if missing
    const rostershipColor = getRostershipColor(rostershipValue);

    rightSection.innerHTML = `
        <div class="metric"><span class="label">ADP:</span> <span class="value">${row.adp}</span></div>
        <div class="metric">
            <span class="label">Rostership:</span>
            <span class="value" style="color: ${rostershipColor}; font-weight: bold;">
                ${rostershipValue}
            </span>
        </div>`;
    

    // Expandable Section (Hidden Initially)
    const expandableSection = document.createElement("div");
    expandableSection.classList.add("expandable-content");
    expandableSection.innerHTML = `
        <div class="metric"><span class="label">Position Rank:</span> <span class="value">${row.positionRank}</span></div>
        <div class="metric"><span class="label">Team:</span> <span class="value">${row.teamName}</span></div>
        <div class="metric"><span class="label">Rank:</span> <span class="value">${row.rank}</span></div>`;

    // Toggle button (+ or -)
    const toggleButton = document.createElement("button");
    toggleButton.innerHTML = isSelected ? "−" : "+";
    toggleButton.style.backgroundColor = isSelected ? "dodgerblue" : "gray"; // Black for "−", Blue for "+"
    toggleButton.style.color = isSelected ? "#fff" : "#fff"; // White text for both states
    
    toggleButton.classList.add("toggle-button");

    toggleButton.addEventListener("click", function (event) {
        event.stopPropagation(); // Prevents expanding when clicking the button
    
        if (isSelectedCard(row)) {
            // Remove from selectedCards
            selectedCards = selectedCards.filter(item => item.firstName !== row.firstName || item.lastName !== row.lastName);
        } else {
            // Add to selectedCards
            selectedCards.push(row);
        }
    
        selectedCards = selectedCards.filter(item => item.rank && item.rank.trim() !== "");
        selectedCards.sort((a, b) => parseInt(a.rank || 0) - parseInt(b.rank || 0));
    
        updateSelectedCards(); // Only update selected cards
    
        // ✅ Check if the row is now selected and update the button accordingly
        const currentlySelected = isSelectedCard(row);
        toggleButton.innerHTML = currentlySelected ? "−" : "+";
        toggleButton.style.backgroundColor = currentlySelected ? "dodgerblue" : "gray"; // Black for "−", Blue for "+"
        toggleButton.style.color = currentlySelected ? "#fff" : "#fff"; // White text for both states
    
        // ✅ Update the button state in csvTable
        updateCsvTableButton(row);
    });
    

    // Expand/Collapse on Click
    card.addEventListener("click", function (event) {
        if (event.target !== toggleButton) { // Prevent toggle click from triggering expansion
            card.classList.toggle("expanded");
        }
    });

    // Add elements to card
    card.appendChild(leftSection);
    card.appendChild(rightSection);
    card.appendChild(expandableSection);
    card.appendChild(toggleButton);

    return card;
}

