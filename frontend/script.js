document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('csvFile').addEventListener('change', handleFileUpload);
});

let allCards = [];
let selectedCards = [];
let columnsToDisplayIndexes = [];

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

function createFilterTabs(slotIndex) {
    // Filter out invalid slotName values (undefined, null, or empty strings)
    const uniqueValues = [...new Set(allCards.map(row => row.slotName && row.slotName.trim()))];
    const validValues = uniqueValues.filter(value => value && value !== "undefined" && value.trim() !== "");

    const filterTabs = document.getElementById("filterTabs");

    // Create "All" tab
    filterTabs.innerHTML = `<span class="tab active" onclick="filterTable(null, ${slotIndex})">All</span>`; 
    console.log(validValues)
    // Create tabs for valid slotName values
    validValues.forEach(value => {
        filterTabs.innerHTML += `<span class="tab" onclick="filterTable('${value}', ${slotIndex})">${value}</span>`;
    });
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

function createCard(row, isSelected) {
    const card = document.createElement("div");
    card.classList.add("card");

    // Left section (Name + SlotName)
    const leftSection = document.createElement("div");
    leftSection.classList.add("card-left");
    leftSection.innerHTML = `<div class="name">${row.firstName} ${row.lastName}</div>
                             <div class="slotName">${row.slotName}</div>`;

    // Right section (Metrics)
    const rightSection = document.createElement("div");
    rightSection.classList.add("card-right");
    rightSection.innerHTML = `
        <div class="metric"><span class="label">ADP:</span> <span class="value">${row.adp}</span></div>
        <div class="metric"><span class="label">Projected Points:</span> <span class="value">${row.projectedPoints}</span></div>
        <div class="metric"><span class="label">Position Rank:</span> <span class="value">${row.positionRank}</span></div>
        <div class="metric"><span class="label">Team:</span> <span class="value">${row.teamName}</span></div>
        <div class="metric"><span class="label">Rank:</span> <span class="value">${row.rank}</span></div>`;

    // Toggle button
    const toggleButton = document.createElement("button");
    toggleButton.innerHTML = isSelected ? "−" : "+";  // Show "minus" if selected, else show "plus"
    toggleButton.classList.add("toggle-button");

    toggleButton.addEventListener("click", function () {
        if (isSelected) {
            selectedCards = selectedCards.filter(item => item.firstName !== row.firstName || item.lastName !== row.lastName);  // Remove from selectedCards based on `firstName` and `lastName`
        } else {
            selectedCards.push(row);
        }

        // Re-sort selected cards based on the rank column each time a new card is selected or deselected
        selectedCards = selectedCards.filter(item => item.rank && item.rank.trim() !== "");  // Filter out cards without rank
        selectedCards.sort((a, b) => {
            const rankA = a.rank ? parseInt(a.rank) : 0; // Handle cases where rank may be undefined
            const rankB = b.rank ? parseInt(b.rank) : 0; 
            return rankA - rankB;
        });

        displayCards();  // Refresh the displayed cards
    });

    // Add elements to card
    card.appendChild(leftSection);
    card.appendChild(rightSection);
    card.appendChild(toggleButton);

    return card;
}