// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const jumpBtn = document.getElementById('jumpBtn');
const livesCount = document.getElementById('livesCount');
const scoreCount = document.getElementById('scoreCount');

// Game state
let gameState = {
    lives: 5,
    score: 0,
    gameRunning: true
};

// Player object
const player = {
    x: 200, // Fixed screen position
    y: 400,
    width: 40,
    height: 60,
    velocityX: 0,
    velocityY: 0,
    speed: 3,
    autoSpeed: 3, // Constant forward movement (now affects world scroll)
    jumpPower: 18, // Increased for more responsive feel
    onGround: false,
    color: '#8B4513',
    worldX: 200, // Actual world position
    jumpRequested: false // Add jump buffer
};

// Game objects arrays
let platforms = [];
let waterDrops = [];
let oilDrops = [];
let cameraX = 0; // Camera offset for scrolling

// Game physics
const gravity = 0.7; // Slightly reduced for better feel
const friction = 0.85;

// Drop generation variables
let lastWaterDropX = 0;
let lastOilDropX = 0;
let waterDropCounter = 0;
let oilDropCounter = 0;
const minDropDistance = 120;
const maxDropDistance = 250;
const waterDropFrequency = 0.7; // Higher = more frequent
const oilDropFrequency = 0.4; // Lower = less frequent

// Initialize platforms based on mockup
function initializePlatforms() {
    platforms = [
        // Ground level - starts from far left and extends far right
        { x: -2000, y: 500, width: 10000, height: 100, color: '#4A934A', isGround: true },
        // Generate platforms procedurally
        { x: 300, y: 350, width: 120, height: 20, color: '#E8E8E8' },
        { x: 550, y: 280, width: 120, height: 20, color: '#E8E8E8' },
        { x: 800, y: 350, width: 120, height: 20, color: '#E8E8E8' },
        { x: 1100, y: 400, width: 120, height: 20, color: '#E8E8E8' },
        { x: 1350, y: 320, width: 120, height: 20, color: '#E8E8E8' },
        { x: 1600, y: 380, width: 120, height: 20, color: '#E8E8E8' },
        { x: 1900, y: 300, width: 120, height: 20, color: '#E8E8E8' },
        { x: 2200, y: 360, width: 120, height: 20, color: '#E8E8E8' }
    ];
}

// Generate new platforms ahead of the player
function generatePlatforms() {
    const lastPlatform = platforms[platforms.length - 1];
    
    // Extend ground if needed
    const groundPlatform = platforms.find(p => p.isGround);
    if (groundPlatform && player.worldX + 2000 > groundPlatform.x + groundPlatform.width) {
        groundPlatform.width += 5000; // Extend ground by 5000 pixels
    }
    
    // Generate regular platforms
    if (lastPlatform.x < player.worldX + 1500) {
        const newX = lastPlatform.x + Math.random() * 400 + 200;
        const newY = Math.random() * 200 + 250; // Between y 250-450
        platforms.push({
            x: newX,
            y: newY,
            width: 120,
            height: 20,
            color: '#E8E8E8'
        });
    }
}

// Initialize game objects
function initializeDrops() {
    // Start with some initial drops
    waterDrops = [];
    oilDrops = [];
    
    // Generate initial drops with better spacing
    for (let i = 0; i < 3; i++) {
        generateWaterDrop();
    }
    for (let i = 0; i < 2; i++) {
        generateOilDrop();
    }
}

// Generate water drops randomly
function generateWaterDrop() {
    const x = Math.max(lastWaterDropX + minDropDistance, player.worldX + 300) + Math.random() * maxDropDistance;
    
    // Better Y positioning - avoid extreme heights and ensure reachability
    let y;
    const nearbyPlatforms = platforms.filter(p => Math.abs(p.x - x) < 200 && !p.isGround);
    
    if (nearbyPlatforms.length > 0 && Math.random() < 0.6) {
        // Position near a platform
        const platform = nearbyPlatforms[Math.floor(Math.random() * nearbyPlatforms.length)];
        y = platform.y - 40 - Math.random() * 60; // Above platform
    } else {
        // Random height but more reasonable range
        y = Math.random() * 200 + 150; // Between y 150-350
    }
    
    waterDrops.push({
        x: x,
        y: Math.max(50, y), // Don't spawn too high
        width: 30,
        height: 30,
        collected: false
    });
    
    lastWaterDropX = x;
    waterDropCounter++;
}

// Generate oil drops randomly
function generateOilDrop() {
    const x = Math.max(lastOilDropX + minDropDistance, player.worldX + 400) + Math.random() * maxDropDistance;
    
    // Oil drops spawn in more strategic locations
    let y;
    const nearbyPlatforms = platforms.filter(p => Math.abs(p.x - x) < 150 && !p.isGround);
    
    if (nearbyPlatforms.length > 0 && Math.random() < 0.8) {
        // Position on or near platforms to create obstacles
        const platform = nearbyPlatforms[Math.floor(Math.random() * nearbyPlatforms.length)];
        y = platform.y - 35; // Just above platform
    } else {
        // Ground level or jump height
        y = Math.random() < 0.5 ? 470 : (Math.random() * 150 + 200); // Ground or mid-air
    }
    
    oilDrops.push({
        x: x,
        y: y,
        width: 30,
        height: 30,
        active: true
    });
    
    lastOilDropX = x;
    oilDropCounter++;
}

// Generate new drops ahead of the player
function generateNewDrops() {
    // Generate water drops more frequently
    if (Math.random() < waterDropFrequency && lastWaterDropX < player.worldX + 800) {
        generateWaterDrop();
    }
    
    // Generate oil drops less frequently but strategically
    if (Math.random() < oilDropFrequency && lastOilDropX < player.worldX + 1000) {
        generateOilDrop();
    }
    
    // Ensure minimum spawn rate - force spawn if too far behind
    if (lastWaterDropX < player.worldX + 400) {
        generateWaterDrop();
    }
    
    if (lastOilDropX < player.worldX + 600) {
        generateOilDrop();
    }
    
    // Clean up old drops that are far behind
    waterDrops = waterDrops.filter(drop => drop.x > player.worldX - 300);
    oilDrops = oilDrops.filter(drop => drop.x > player.worldX - 300);
}

// Draw player
function drawPlayer() {
    // Player is always drawn at the same screen position
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw simple character features
    ctx.fillStyle = '#FFE4C4'; // Skin tone
    ctx.fillRect(player.x + 10, player.y + 5, 20, 20); // Head
    
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 14, player.y + 9, 3, 3); // Eye 1
    ctx.fillRect(player.x + 23, player.y + 9, 3, 3); // Eye 2
    
    ctx.fillStyle = '#FF6B6B'; // Red shirt
    ctx.fillRect(player.x + 5, player.y + 25, 30, 25);
    
    ctx.fillStyle = '#4ECDC4'; // Blue shorts
    ctx.fillRect(player.x + 8, player.y + 50, 24, 10);
}

// Draw platforms
function drawPlatforms() {
    platforms.forEach(platform => {
        const screenX = platform.x - player.worldX + player.x;
        
        // Only draw if platform is on screen
        if (screenX + platform.width > -50 && screenX < canvas.width + 50) {
            ctx.fillStyle = platform.color;
            ctx.fillRect(screenX, platform.y, platform.width, platform.height);
            
            // Add border for platforms (not ground)
            if (platform.y < 500 && !platform.isGround) {
                ctx.strokeStyle = '#CCC';
                ctx.lineWidth = 2;
                ctx.strokeRect(screenX, platform.y, platform.width, platform.height);
            }
        }
    });
}

// Draw water drops
function drawWaterDrops() {
    waterDrops.forEach(drop => {
        if (!drop.collected) {
            const screenX = drop.x - player.worldX + player.x;
            
            // Only draw if drop is on screen
            if (screenX + drop.width > -50 && screenX < canvas.width + 50) {
                // Draw water drop emoji-style
                ctx.fillStyle = '#4A90E2';
                ctx.beginPath();
                ctx.ellipse(screenX + 15, drop.y + 20, 12, 15, 0, 0, 2 * Math.PI);
                ctx.fill();
                
                // Highlight
                ctx.fillStyle = '#87CEEB';
                ctx.beginPath();
                ctx.ellipse(screenX + 12, drop.y + 15, 4, 6, 0, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    });
}

// Draw oil drops
function drawOilDrops() {
    oilDrops.forEach(drop => {
        if (drop.active) {
            const screenX = drop.x - player.worldX + player.x;
            
            // Only draw if drop is on screen
            if (screenX + drop.width > -50 && screenX < canvas.width + 50) {
                // Draw oil drop
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.ellipse(screenX + 15, drop.y + 20, 12, 15, 0, 0, 2 * Math.PI);
                ctx.fill();
                
                // Dark highlight
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.ellipse(screenX + 12, drop.y + 15, 4, 6, 0, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    });
}

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update player physics
function updatePlayer() {
    // Update world position (character moves forward in world space)
    player.worldX += player.autoSpeed;
    
    // Apply gravity
    if (!player.onGround) {
        player.velocityY += gravity;
    }
    
    // Update vertical position
    player.y += player.velocityY;
    
    // Platform collision (using world coordinates for collision detection)
    let wasOnGround = player.onGround;
    player.onGround = false;
    
    platforms.forEach(platform => {
        const playerWorldBounds = {
            x: player.worldX,
            y: player.y,
            width: player.width,
            height: player.height
        };
        
        if (checkCollision(playerWorldBounds, platform)) {
            // Landing on top of platform
            if (player.velocityY > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
                
                // Execute buffered jump immediately upon landing
                if (player.jumpRequested) {
                    player.velocityY = -player.jumpPower;
                    player.onGround = false;
                    player.jumpRequested = false;
                }
            }
        }
    });
    
    // Clear jump request after a short time to prevent infinite buffering
    if (player.jumpRequested && !wasOnGround && !player.onGround) {
        // Clear after a few frames if still in air
        setTimeout(() => {
            player.jumpRequested = false;
        }, 100);
    }
    
    // Check water drop collection
    waterDrops.forEach(drop => {
        if (!drop.collected) {
            const playerWorldBounds = {
                x: player.worldX,
                y: player.y,
                width: player.width,
                height: player.height
            };
            
            if (checkCollision(playerWorldBounds, drop)) {
                drop.collected = true;
                gameState.score += 10;
                updateScore();
            }
        }
    });
    
    // Check oil drop collision
    oilDrops.forEach(drop => {
        if (drop.active) {
            const playerWorldBounds = {
                x: player.worldX,
                y: player.y,
                width: player.width,
                height: player.height
            };
            
            if (checkCollision(playerWorldBounds, drop)) {
                drop.active = false;
                gameState.lives--;
                updateLives();
                
                if (gameState.lives <= 0) {
                    gameOver();
                }
            }
        }
    });
    
    // Generate new content
    generatePlatforms();
    generateNewDrops();
}

// Player jump
function playerJump() {
    if (gameState.gameRunning) {
        if (player.onGround) {
            // Immediate jump
            player.velocityY = -player.jumpPower;
            player.onGround = false;
        } else {
            // Jump buffering - allow jump request slightly before landing
            player.jumpRequested = true;
        }
    }
}

// Update UI
function updateScore() {
    scoreCount.textContent = gameState.score;
}

function updateLives() {
    livesCount.textContent = gameState.lives;
}

// Game over
function gameOver() {
    gameState.gameRunning = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Refresh to play again', canvas.width / 2, canvas.height / 2 + 60);
}

// Main game loop
function gameLoop() {
    if (!gameState.gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game objects
    updatePlayer();
    
    // Draw everything
    drawPlatforms();
    drawWaterDrops();
    drawOilDrops();
    drawPlayer();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Event listeners
jumpBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    playerJump();
});

jumpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    playerJump();
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!gameState.gameRunning) return;
    
    switch(e.key) {
        case ' ':
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            e.stopPropagation();
            playerJump();
            break;
    }
});

// Touch controls for mobile - canvas touch
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    playerJump();
});

// Mouse click on canvas
canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    playerJump();
});

// Initialize and start game
function initGame() {
    initializePlatforms();
    initializeDrops();
    updateScore();
    updateLives();
    gameLoop();
}

// Start the game when page loads
window.addEventListener('load', initGame);