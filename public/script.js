let horses = [];
let isRacing = false;
let raceStartTime = 0;
let bets = {};
let horseTypes = [];
let availableTypes = [];

// Fetch horse types from JSON file
fetch('horses.json')
    .then(response => response.json())
    .then(data => {
        horseTypes = data;
        resetAvailableTypes();
    })
    .catch(error => console.error('Error loading horse types:', error));

function resetAvailableTypes() {
    availableTypes = [...horseTypes];
}

function addHorse() {
    if (horses.length >= 8) {
        alert("You can only have up to 8 horses!");
        return;
    }

    if (availableTypes.length === 0) {
        alert("No more unique horse types available!");
        return;
    }

    const nameInput = document.getElementById("name-input");
    const userGivenName = nameInput.value.trim();
    if (userGivenName === "") {
        alert("Please enter a name for the horse!");
        return;
    }

    // Select a random unused type
    const randomIndex = Math.floor(Math.random() * availableTypes.length);
    const randomType = availableTypes[randomIndex];
    
    // Remove the selected type from available types
    availableTypes.splice(randomIndex, 1);
    
    const newHorse = { 
        name: userGivenName,  // Use the user-given name
        type: randomType.TypeName,  // Use TypeName for the horse type
        position: 0, 
        finished: false, 
        time: 0,
        ...randomType // Spread operator to include all properties from the JSON
    };
    horses.push(newHorse);
    bets[userGivenName] = 0;  // Initialize bet for this horse
    nameInput.value = "";

    console.log("Added horse:", newHorse);  // Log the added horse

    updateHorseList();
    updateBettingSection();
}

function updateHorseList() {
    const horseList = document.getElementById("horse-list");
    horseList.innerHTML = "<h3>Horses:</h3>";
    horses.forEach(horse => {
        console.log("Updating horse list with:", horse.name);  // Log each horse name
        horseList.innerHTML += `<div class="horse-item">${horse.name}</div>`;
    });
}

function updateBettingSection() {
    const bettingSection = document.getElementById("betting-section");
    bettingSection.innerHTML = "<h3>Place Your Bets:</h3>";

    horses.forEach((horse) => {
        console.log("Updating betting section with:", horse.name);  // Log each horse name
        const betContainer = document.createElement("div");
        betContainer.classList.add("bet-container");

        const minusButton = document.createElement("button");
        minusButton.textContent = "-";
        minusButton.onclick = () => adjustBet(horse.name, -1);
        minusButton.disabled = isRacing;

        const betDisplay = document.createElement("span");
        betDisplay.textContent = bets[horse.name];
        betDisplay.id = `bet-${horse.name}`;
        betDisplay.classList.add("bet-amount");

        const plusButton = document.createElement("button");
        plusButton.textContent = "+";
        plusButton.onclick = () => adjustBet(horse.name, 1);
        plusButton.disabled = isRacing;

        const horseName = document.createElement("span");
        horseName.textContent = horse.name;
        horseName.classList.add("horse-name");

        betContainer.appendChild(minusButton);
        betContainer.appendChild(betDisplay);
        betContainer.appendChild(plusButton);
        betContainer.appendChild(horseName);

        bettingSection.appendChild(betContainer);
    });
}

function adjustBet(horseName, amount) {
    bets[horseName] = Math.max(0, (bets[horseName] || 0) + amount);
    document.getElementById(`bet-${horseName}`).textContent = bets[horseName];
}

function placeBet(horseIndex) {
    if (isRacing) return;

    currentBet = horseIndex;
    alert(`You've placed a bet on ${horses[horseIndex].name}!`);
    updateBettingSection();
}

function startRace() {
    if (horses.length < 2) {
        alert("You need at least 2 horses to start the race!");
        return;
    }

    if (isRacing) return;

    if (Object.values(bets).every(bet => bet === 0)) {
        alert("Please place at least one bet before starting the race!");
        return;
    }

    // Clear any previous results and reset horse positions
    document.getElementById("scoreboard").innerHTML = "";
    document.getElementById("track").innerHTML = "";
    horses.forEach(horse => {
        horse.position = 0;
        horse.finished = false;
        horse.time = 0;
    });

    isRacing = true;
    updateBettingSection();
    raceStartTime = Date.now();
    horses.forEach((horse, index) => {
        createHorse(index);
    });

    requestAnimationFrame(runRace);
}

function createHorse(index) {
    const track = document.getElementById("track");
    const horseElem = document.createElement("div");
    horseElem.classList.add("horse");
    horseElem.style.backgroundColor = getRandomColor();
    horseElem.style.top = `${index * 30}px`;
    horseElem.innerHTML = horses[index].name[0].toUpperCase();
    horseElem.id = `horse-${index}`;
    track.appendChild(horseElem);
}

function runRace() {
    let allFinished = true;

    horses.forEach((horse, index) => {
        if (horse.finished) return;

        let speed = 0.15; // Default speed

        // Adjust speed based on horse type
        if (horse.speed) {
            speed = horse.speed;
        } else if (horse.speedPattern) {
            speed = horse.position < 50 ? horse.speedPattern[0] : horse.speedPattern[1];
        } else if (horse.speedRange) {
            speed = Math.random() * (horse.speedRange[1] - horse.speedRange[0]) + horse.speedRange[0];
        } else if (horse.pauseChance) {
            speed = Math.random() > horse.pauseChance ? 0 : 0.15;
        }

        horse.position += speed;
        if (horse.position >= 98) {
            horse.finished = true;
            horse.time = (Date.now() - raceStartTime) / 1000;
        } else {
            allFinished = false;
        }

        document.getElementById(`horse-${index}`).style.left = `${horse.position}%`;
    });

    if (!allFinished) {
        requestAnimationFrame(runRace);
    } else {
        showResults();
        isRacing = false;
    }
}

function showResults() {
    horses.sort((a, b) => a.time - b.time);
    const scoreboard = document.getElementById("scoreboard");
    scoreboard.innerHTML = "<h3>Race Results:</h3>";
    
    horses.forEach((horse, index) => {
        scoreboard.innerHTML += `${index + 1}. ${horse.name} (${horse.type}) - ${horse.time.toFixed(2)}s<br>`;
    });

    scoreboard.innerHTML += "<h3>Betting Results:</h3>";
    let totalWinnings = 0;
    horses.forEach((horse, index) => {
        const betAmount = bets[horse.name];
        let winnings = 0;
        if (index === 0) {
            winnings = betAmount * 3;  // Triple money for first place
        } else if (index === 1) {
            winnings = betAmount * 2;  // Double money for second place
        } else if (index === 2) {
            winnings = betAmount;  // Get your money back for third place
        }
        totalWinnings += winnings;
        scoreboard.innerHTML += `${horse.name}: Bet ${betAmount}, Won ${winnings}<br>`;
    });
    scoreboard.innerHTML += `<strong>Total Winnings: ${totalWinnings}</strong>`;
}

function resetRace() {
    isRacing = false;
    horses = [];
    bets = {};
    resetAvailableTypes();  // Reset available types
    document.getElementById("track").innerHTML = "";
    document.getElementById("scoreboard").innerHTML = "";
    updateHorseList();
    updateBettingSection();
}

function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}