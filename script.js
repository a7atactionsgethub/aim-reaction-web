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
let targetSize = 'medium'; // small, medium, large
let mouseX = 0, mouseY = 0;

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
const smallBtn = document.getElementById('smallBtn');
const mediumBtn = document.getElementById('mediumBtn');
const largeBtn = document.getElementById('largeBtn');
const reactionTimeEl = document.getElementById('reactionTime');
const targetsHitEl = document.getElementById('targetsHit');
const accuracyEl = document.getElementById('accuracy');
const averageTimeEl = document.getElementById('averageTime');
const ratingDisplay = document.getElementById('ratingDisplay');
const historyList = document.getElementById('historyList');

// Target class - Rectangular targets
class Target {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width || 80;
        this.height = height || 50;
        this.color = this.getRandomColor();
        this.hit = false;
        this.number = Math.floor(Math.random() * 9) + 1; // Random number 1-9
    }
    
    getRandomColor() {
        const colors = [
            '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
            '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', 
            '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    draw() {
        // Draw rectangle
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Rounded corners
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'white';
        ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Draw number in center
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.min(this.width, this.height)/2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.number.toString(), this.x, this.y);
        
        // Inner highlight effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(
            this.x - this.width/2 + 2, 
            this.y - this.height/2 + 2, 
            this.width - 4, 
            10
        );
    }
    
    isClicked(clickX, clickY) {
        return (
            clickX >= this.x - this.width/2 &&
            clickX <= this.x + this.width/2 &&
            clickY >= this.y - this.height/2 &&
            clickY <= this.y + this.height/2
        );
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

// Create a new target with size based on difficulty
function createNewTarget() {
    if (!gameRunning || gamePaused) return;
    
    // Remove any existing target
    targets = [];
    
    // Set size based on difficulty
    let width, height;
    switch(targetSize) {
        case 'small':
            width = 40 + Math.random() * 20;
            height = 30 + Math.random() * 15;
            break;
        case 'large':
            width = 100 + Math.random() * 40;
            height = 70 + Math.random() * 30;
            break;
        case 'medium':
        default:
            width = 60 + Math.random() * 40;
            height = 40 + Math.random() * 30;
    }
    
    // Ensure target stays within canvas bounds
    const x = width/2 + Math.random() * (canvas.width - width);
    const y = height/2 + Math.random() * (canvas.height - height);
    
    const target = new Target(x, y, width, height);
    targets.push(target);
    currentTarget = target;
    targetAppearTime = Date.now();
}

// Update size buttons
function updateSizeButtons() {
    smallBtn.classList.remove('active');
    mediumBtn.classList.remove('active');
    largeBtn.classList.remove('active');
    
    document.getElementById(`${targetSize}Btn`).classList.add('active');
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
    
    // Draw crosshair
    drawCrosshair();
    
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

// Draw crosshair
function drawCrosshair() {
    if (!gameRunning || gamePaused) return;
    
    // Outer circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Cross lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(mouseX - 10, mouseY);
    ctx.lineTo(mouseX + 10, mouseY);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(mouseX, mouseY - 10);
    ctx.lineTo(mouseX, mouseY + 10);
    ctx.stroke();
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
        ctx.fillText(`Current target size: ${targetSize.toUpperCase()}`, canvas.width / 2, canvas.height / 2 + 50);
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
    
    // Draw game stats on canvas
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`Hits: ${hits}`, 20, 30);
    
    const accuracy = totalShots > 0 ? Math.round((hits / totalShots) * 100) : 0;
    ctx.fillText(`Accuracy: ${accuracy}%`, 20, 60);
    
    // Draw current target info if visible
    if (currentTarget && !currentTarget.hit) {
        const timeVisible = Date.now() - targetAppearTime;
        ctx.fillText(`Target #${currentTarget.number}: ${timeVisible}ms`, 20, 90);
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
            
            // Draw hit effect
            drawHitEffect(x, y, target.color);
            
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
    
    // If no target was hit
    if (!targetHit) {
        // Draw miss effect
        drawMissEffect(x, y);
        updateStats();
        updateRating();
    }
});

// Track mouse movement for crosshair
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Draw hit effect
function drawHitEffect(x, y, color) {
    // Explosion effect
    const particles = 12;
    for (let i = 0; i < particles; i++) {
        const angle = (i / particles) * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        const size = 3 + Math.random() * 4;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
            x + Math.cos(angle) * speed * 5,
            y + Math.sin(angle) * speed * 5,
            size, 0, Math.PI * 2
        );
        ctx.fill();
    }
    
    // Hit text
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HIT!', x, y - 30);
}

// Draw miss effect
function drawMissEffect(x, y) {
    // Crosshair for miss
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x, y + 15);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x - 15, y);
    ctx.lineTo(x + 15, y);
    ctx.stroke();
    
    // Miss text
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MISS!', x, y - 30);
}

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
        color = "#FFD700";
    } else if (avgReactionTime < 200 && accuracy >= 80) {
        rating = "VERY FAST";
        color = "#00FF00";
    } else if (avgReactionTime < 300 && accuracy >= 70) {
        rating = "FAST";
        color = "#4CAF50";
    } else if (avgReactionTime < 500 && accuracy >= 60) {
        rating = "AVERAGE";
        color = "#2196F3";
    } else {
        rating = "SLOW";
        color = "#FF5252";
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

// Event listeners for size buttons
smallBtn.addEventListener('click', () => {
    targetSize = 'small';
    updateSizeButtons();
});

mediumBtn.addEventListener('click', () => {
    targetSize = 'medium';
    updateSizeButtons();
});

largeBtn.addEventListener('click', () => {
    targetSize = 'large';
    updateSizeButtons();
});

// Initialize game on load
window.addEventListener('load', () => {
    initGame();
    updateSizeButtons();
    
    // Add some sample history items for demonstration
    addToHistory(215);
    addToHistory(189);
    addToHistory(312);
    addToHistory(278);
    addToHistory(401);
});