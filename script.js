// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameRunning = false;
let gamePaused = false;
let targets = [];
let hits = 0;
let totalShots = 0;
let reactionTimes = [];
let currentTarget = null;
let targetAppearTime = 0;
let gameInterval;
let targetInterval;

// Set canvas dimensions
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Update canvas size when window resizes
window.addEventListener('resize', () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
});

// DOM elements
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const reactionTimeEl = document.getElementById('reactionTime');
const targetsHitEl = document.getElementById('targetsHit');
const accuracyEl = document.getElementById('accuracy');
const averageTimeEl = document.getElementById('averageTime');
const ratingDisplay = document.getElementById('ratingDisplay');
const historyList = document.getElementById('historyList');

// Target class
class Target {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = this.getRandomColor();
        this.hit = false;
    }
    
    getRandomColor() {
        const colors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Inner circle for better visibility
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Outer border
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }
    
    isClicked(x, y) {
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        return distance <= this.radius;
    }
}

// Initialize game
function initGame() {
    targets = [];
    hits = 0;
    totalShots = 0;
    reactionTimes = [];
    currentTarget = null;
    updateStats();
    updateRating();
    clearHistory();
    
    // Draw initial empty canvas
    draw();
}

// Start game
function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    gamePaused = false;
    startBtn.innerHTML = '<i class="fas fa-play"></i> Restart';
    
    // Clear any existing intervals
    clearIntervals();
    
    // Start creating targets
    targetInterval = setInterval(createNewTarget, 1000);
    
    // Start game loop
    gameInterval = setInterval(draw, 16); // ~60fps
}

// Pause/Resume game
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        clearIntervals();
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        targetInterval = setInterval(createNewTarget, 1000);
        gameInterval = setInterval(draw, 16);
    }
}

// Reset game
function resetGame() {
    gameRunning = false;
    gamePaused = false;
    startBtn.innerHTML = '<i class="fas fa-play"></i> Start Game';
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    clearIntervals();
    initGame();
}

// Clear game intervals
function clearIntervals() {
    clearInterval(gameInterval);
    clearInterval(targetInterval);
}

// Create a new target
function createNewTarget() {
    if (!gameRunning || gamePaused) return;
    
    // Remove any existing target
    targets = [];
    
    // Create a new target at random position
    const radius = 25 + Math.random() * 20;
    const x = radius + Math.random() * (canvas.width - radius * 2);
    const y = radius + Math.random() * (canvas.height - radius * 2);
    
    const target = new Target(x, y, radius);
    targets.push(target);
    currentTarget = target;
    targetAppearTime = Date.now();
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    drawGrid();
    
    // Draw all targets
    targets.forEach(target => {
        if (!target.hit) {
            target.draw();
        }
    });
    
    // Draw game info on canvas
    drawGameInfo();
}

// Draw background grid
function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Draw game info on canvas
function drawGameInfo() {
    if (!gameRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#00b4db';
        ctx.textAlign = 'center';
        ctx.fillText('Click START to begin!', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#a0d2eb';
        ctx.fillText('Hit targets as quickly as possible', canvas.width / 2, canvas.height / 2 + 50);
        return;
    }
    
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#FF9800';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#a0d2eb';
        ctx.fillText('Click RESUME to continue', canvas.width / 2, canvas.height / 2 + 50);
    }
    
    // Draw hits counter on canvas
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`Hits: ${hits}`, 20, 30);
    
    // Draw accuracy on canvas
    const accuracy = totalShots > 0 ? Math.round((hits / totalShots) * 100) : 0;
    ctx.fillText(`Accuracy: ${accuracy}%`, 20, 60);
    
    // Draw current reaction time if target is visible
    if (currentTarget && !currentTarget.hit) {
        const timeVisible = Date.now() - targetAppearTime;
        ctx.fillText(`Current: ${timeVisible}ms`, 20, 90);
    }
}

// Handle canvas click
canvas.addEventListener('click', (e) => {
    if (!gameRunning || gamePaused) return;
    
    totalShots++;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let targetHit = false;
    
    // Check if any target was hit
    targets.forEach(target => {
        if (!target.hit && target.isClicked(x, y)) {
            target.hit = true;
            targetHit = true;
            hits++;
            
            // Calculate reaction time
            const reactionTime = Date.now() - targetAppearTime;
            reactionTimes.push(reactionTime);
            
            // Add to history
            addToHistory(reactionTime);
            
            // Update stats
            updateStats();
            updateRating();
            
            // Remove target after a short delay
            setTimeout(() => {
                const index = targets.indexOf(target);
                if (index > -1) {
                    targets.splice(index, 1);
                }
            }, 200);
        }
    });
    
    // If no target was hit, count as miss
    if (!targetHit) {
        updateStats();
        updateRating();
    }
});

// Update stats display
function updateStats() {
    // Update reaction time (latest or average)
    let latestReactionTime = reactionTimes.length > 0 ? reactionTimes[reactionTimes.length - 1] : 0;
    reactionTimeEl.textContent = `${latestReactionTime} ms`;
    
    // Update targets hit
    targetsHitEl.textContent = hits;
    
    // Update accuracy
    const accuracy = totalShots > 0 ? Math.round((hits / totalShots) * 100) : 0;
    accuracyEl.textContent = `${accuracy}%`;
    
    // Update average reaction time
    let avgReactionTime = 0;
    if (reactionTimes.length > 0) {
        const sum = reactionTimes.reduce((a, b) => a + b, 0);
        avgReactionTime = Math.round(sum / reactionTimes.length);
    }
    averageTimeEl.textContent = `${avgReactionTime} ms`;
}

// Update rating display
function updateRating() {
    if (reactionTimes.length === 0) {
        ratingDisplay.textContent = "Click Start!";
        ratingDisplay.style.color = "#a0d2eb";
        return;
    }
    
    // Calculate average reaction time
    const sum = reactionTimes.reduce((a, b) => a + b, 0);
    const avgReactionTime = sum / reactionTimes.length;
    
    // Calculate accuracy
    const accuracy = totalShots > 0 ? (hits / totalShots) * 100 : 0;
    
    // Determine rating based on average reaction time and accuracy
    let rating, color;
    
    if (avgReactionTime < 150 && accuracy >= 90) {
        rating = "ELITE";
        color = "#FFD700"; // Gold
    } else if (avgReactionTime < 200 && accuracy >= 80) {
        rating = "VERY FAST";
        color = "#00FF00"; // Green
    } else if (avgReactionTime < 300 && accuracy >= 70) {
        rating = "FAST";
        color = "#4CAF50"; // Light Green
    } else if (avgReactionTime < 500 && accuracy >= 60) {
        rating = "AVERAGE";
        color = "#2196F3"; // Blue
    } else {
        rating = "SLOW";
        color = "#FF5252"; // Red
    }
    
    ratingDisplay.textContent = rating;
    ratingDisplay.style.color = color;
}

// Add reaction time to history
function addToHistory(reactionTime) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    historyItem.innerHTML = `
        <span>${time}</span>
        <span>${reactionTime} ms</span>
    `;
    
    // Add to beginning of list
    historyList.prepend(historyItem);
    
    // Limit to 10 items
    if (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
}

// Clear history
function clearHistory() {
    historyList.innerHTML = '';
}

// Event listeners for buttons
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);

// Initialize game on load
window.addEventListener('load', () => {
    initGame();
    
    // Add some sample history items for demonstration
    addToHistory(215);
    addToHistory(189);
    addToHistory(312);
    addToHistory(278);
    addToHistory(401);
});