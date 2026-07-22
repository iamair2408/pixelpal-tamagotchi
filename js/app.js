// Game State
let petData = {
    name: "PixelPuff",
    hunger: 80,
    happiness: 80,
    energy: 100,
    xp: 0,
    level: 1,
    coins: 100,
    accessory: 'none',
    isSleeping: false,
    isNight: false,
    lastLogin: Date.now(),
    lastDailyClaim: 0,
    unlockedAccessories: ['none', 'bow']
};

// Load data from LocalStorage
function loadGame() {
    const saved = localStorage.getItem('pixelpal_save');
    if (saved) {
        petData = JSON.parse(saved);
        // Calculate passive time decay if offline
        const elapsedSeconds = Math.floor((Date.now() - petData.lastLogin) / 1000);
        if (elapsedSeconds > 10) {
            const decay = Math.floor(elapsedSeconds / 30);
            petData.hunger = Math.max(0, petData.hunger - decay);
            petData.energy = Math.max(0, petData.energy - decay);
            petData.happiness = Math.max(0, petData.happiness - decay);
        }
    }
    updateUI();
}

// Save data to LocalStorage
function saveGame() {
    petData.lastLogin = Date.now();
    localStorage.setItem('pixelpal_save', JSON.stringify(petData));
}

// Core Actions
function feedPet() {
    if (petData.isSleeping) {
        showMessage("Shh! PixelPuff is sleeping.");
        return;
    }
    if (petData.hunger >= 100) {
        showMessage("PixelPuff is already full!");
        return;
    }
    petData.hunger = Math.min(100, petData.hunger + 25);
    addXP(15);
    petData.coins += 5;
    showMessage("Yum! Tasty snack! (+15 XP, +5 🪙)");
    updateUI();
    saveGame();
}

function playPet() {
    if (petData.isSleeping) {
        showMessage("Can't play while sleeping!");
        return;
    }
    if (petData.energy < 15) {
        showMessage("Too tired to play! Needs sleep 💤");
        return;
    }
    petData.happiness = Math.min(100, petData.happiness + 20);
    petData.energy = Math.max(0, petData.energy - 15);
    petData.hunger = Math.max(0, petData.hunger - 10);
    addXP(25);
    petData.coins += 10;
    showMessage("Wheee! So much fun! (+25 XP, +10 🪙)");
    updateUI();
    saveGame();
}

function sleepPet() {
    petData.isSleeping = !petData.isSleeping;
    if (petData.isSleeping) {
        showMessage("PixelPuff is fast asleep... 💤");
    } else {
        showMessage("Good morning! Ready to play!");
    }
    updateUI();
    saveGame();
}

function addXP(amount) {
    petData.xp += amount;
    let xpNeeded = petData.level * 100;
    if (petData.xp >= xpNeeded) {
        petData.xp -= xpNeeded;
        petData.level++;
        petData.coins += 50;
        showMessage(`🎉 LEVEL UP! Reached Level ${petData.level}! (+50 🪙)`);
    }
}

// Day/Night Cycle & Passive Stat Loop
setInterval(() => {
    const date = new Date();
    const hours = date.getHours();
    petData.isNight = (hours >= 20 || hours < 6);

    if (petData.isSleeping) {
        petData.energy = Math.min(100, petData.energy + 5);
    } else {
        petData.hunger = Math.max(0, petData.hunger - 1);
        petData.energy = Math.max(0, petData.energy - 1);
        petData.happiness = Math.max(0, petData.happiness - 1);
    }

    updateUI();
    saveGame();
}, 5000);

// UI Updates
function updateUI() {
    document.getElementById('hunger-fill').style.width = petData.hunger + '%';
    document.getElementById('happiness-fill').style.width = petData.happiness + '%';
    document.getElementById('energy-fill').style.width = petData.energy + '%';

    document.getElementById('level-display').innerText = `LVL ${petData.level}`;
    document.getElementById('coins-display').innerText = `🪙 ${petData.coins}`;
    let xpNeeded = petData.level * 100;
    document.getElementById('xp-fill').style.width = (petData.xp / xpNeeded) * 100 + '%';

    const screen = document.getElementById('screen');
    const timeDisplay = document.getElementById('time-display');
    if (petData.isNight || petData.isSleeping) {
        screen.classList.add('night');
        timeDisplay.innerText = petData.isSleeping ? '💤 Sleeping' : '🌙 Night';
    } else {
        screen.classList.remove('night');
        timeDisplay.innerText = '☀️ Day';
    }

    const petEl = document.getElementById('pet');
    if (petData.isSleeping) {
        petEl.classList.add('sleeping');
    } else {
        petEl.classList.remove('sleeping');
    }

    document.querySelectorAll('.accessory').forEach(el => el.classList.remove('active'));
    if (petData.accessory !== 'none') {
        const activeAcc = document.getElementById(`acc-${petData.accessory}`);
        if (activeAcc) activeAcc.classList.add('active');
    }
}

function showMessage(text) {
    document.getElementById('message').innerText = text;
}

// Shop & Wardrobe logic
function openShop() {
    document.getElementById('shop-modal').style.display = 'flex';
}

function closeShop() {
    document.getElementById('shop-modal').style.display = 'none';
}

function equipAccessory(type) {
    petData.accessory = type;
    updateUI();
    saveGame();
    showMessage(`Equipped ${type}!`);
    closeShop();
}

function buyAccessory(type, cost) {
    if (petData.unlockedAccessories.includes(type)) {
        equipAccessory(type);
        return;
    }
    if (petData.coins >= cost) {
        petData.coins -= cost;
        petData.unlockedAccessories.push(type);
        equipAccessory(type);
        showMessage(`Successfully purchased and equipped ${type}!`);
    } else {
        showMessage("Not enough coins! Earn more by playing.");
    }
}

// Daily Reward System
function claimDaily() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - petData.lastDailyClaim < oneDay) {
        const hoursLeft = Math.ceil((oneDay - (now - petData.lastDailyClaim)) / (1000 * 60 * 60));
        showMessage(`Daily reward already claimed! Come back in ${hoursLeft}h.`);
    } else {
        petData.lastDailyClaim = now;
        petData.coins += 100;
        addXP(50);
        showMessage("🎁 Daily reward claimed! (+100 🪙, +50 XP)");
        updateUI();
        saveGame();
    }
}

function resetData() {
    if (confirm("Are you sure you want to reset your pet's progress?")) {
        localStorage.removeItem('pixelpal_save');
        location.reload();
    }
}

window.onload = loadGame;
