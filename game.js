const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw() {
        ctx.fillStyle = '#666';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

const game = {
    player: {
        x: 400,
        y: 500,
        width: 40,
        height: 40,
        color: 'green',
        speed: 3,
        health: 3
    },
    gameOver: false,
    score: 0,
    keys: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false
    },
    bullets: [],
    lastShot: 0,
    fireRate: 200,
    walls: [
        new Wall(100, 100, 40, 200),
        new Wall(300, 300, 200, 40),
        new Wall(500, 100, 40, 200)
    ],
    enemies: [],
    lastEnemySpawn: 0,
    enemySpawnRate: 3000,
    powerups: [],
    lastPowerupSpawn: 0,
    powerupSpawnRate: 10000
};

class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type;
        this.color = this.getColor();
    }
    
    getColor() {
        switch(this.type) {
            case 'rapidFire': return 'cyan';
            case 'invincible': return 'gold';
            case 'health': return 'lime';
            default: return 'white';
        }
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.color = 'red';
        this.speed = 2;
        this.lastShot = 0;
        this.fireRate = 1000;
        this.direction = Math.random() < 0.5 ? 'left' : 'right';
    }
    
    update() {
        // Random movement
        if (this.direction === 'left') {
            this.x -= this.speed;
        } else {
            this.x += this.speed;
        }
        
        // Change direction randomly
        if (Math.random() < 0.01) {
            this.direction = this.direction === 'left' ? 'right' : 'left';
        }
        
        // Shoot randomly
        const now = Date.now();
        if (now - this.lastShot > this.fireRate) {
            game.bullets.push({
                x: this.x + this.width/2 - 2.5,
                y: this.y + this.height,
                width: 5,
                height: 10,
                speed: 3,
                direction: 'down'
            });
            this.lastShot = now;
        }
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Event listeners for player controls
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        const now = Date.now();
        if (now - game.lastShot > game.fireRate) {
            game.bullets.push({
                x: game.player.x + game.player.width/2 - 2.5,
                y: game.player.y,
                width: 5,
                height: 10,
                speed: 5,
                direction: 'up'
            });
            game.lastShot = now;
        }
    }
    if (game.keys.hasOwnProperty(e.key)) {
        game.keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (game.keys.hasOwnProperty(e.key)) {
        game.keys[e.key] = false;
    }
});

// Game loop
function update() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update player position
    if (game.keys.ArrowUp) game.player.y -= game.player.speed;
    if (game.keys.ArrowDown) game.player.y += game.player.speed;
    if (game.keys.ArrowLeft) game.player.x -= game.player.speed;
    if (game.keys.ArrowRight) game.player.x += game.player.speed;

    // Draw walls
    game.walls.forEach(wall => wall.draw());
    
    // Check for collisions
    let newX = game.player.x;
    let newY = game.player.y;
    
    if (game.keys.ArrowUp) newY -= game.player.speed;
    if (game.keys.ArrowDown) newY += game.player.speed;
    if (game.keys.ArrowLeft) newX -= game.player.speed;
    if (game.keys.ArrowRight) newX += game.player.speed;
    
    // Create temp player rect for collision detection
    const tempPlayer = {
        x: newX,
        y: newY,
        width: game.player.width,
        height: game.player.height
    };
    
    // Check collisions with walls
    let collision = false;
    game.walls.forEach(wall => {
        if (checkCollision(tempPlayer, wall)) {
            collision = true;
        }
    });
    
    // Update position only if no collision
    if (!collision) {
        game.player.x = newX;
        game.player.y = newY;
    }
    
    // Update and draw bullets
    game.bullets = game.bullets.filter(bullet => {
        // Update position
        if (bullet.direction === 'up') {
            bullet.y -= bullet.speed;
        }
        
        // Check for wall collisions
        const bulletRect = {
            x: bullet.x,
            y: bullet.y,
            width: bullet.width,
            height: bullet.height
        };
        
        let hitWall = false;
        game.walls.forEach(wall => {
            if (checkCollision(bulletRect, wall)) {
                hitWall = true;
            }
        });
        
        // Remove if off screen or hit wall
        if (bullet.y < 0 || hitWall) {
            return false;
        }
        
        // Draw bullet
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        return true;
    });

    // Spawn new enemies
    const now = Date.now();
    if (now - game.lastEnemySpawn > game.enemySpawnRate) {
        game.enemies.push(new Enemy(Math.random() * canvas.width, 0));
        game.lastEnemySpawn = now;
    }

    // Update and draw enemies
    game.enemies = game.enemies.filter(enemy => {
        enemy.update();
        
        // Check for bullet collisions
        const enemyRect = {
            x: enemy.x,
            y: enemy.y,
            width: enemy.width,
            height: enemy.height
        };
        
        let hit = false;
        game.bullets.forEach(bullet => {
            const bulletRect = {
                x: bullet.x,
                y: bullet.y,
                width: bullet.width,
                height: bullet.height
            };
            if (checkCollision(enemyRect, bulletRect) && bullet.direction === 'up') {
                hit = true;
            }
        });
        
        if (hit) {
            game.score += 100;
            // Increase difficulty as score increases
            if (game.score % 1000 === 0) {
                game.enemySpawnRate = Math.max(1000, game.enemySpawnRate - 200);
            }
            return false;
        }
        
        enemy.draw();
        return true;
    });

    // Check for player hit by enemy bullets
    const playerRect = {
        x: game.player.x,
        y: game.player.y,
        width: game.player.width,
        height: game.player.height
    };
    
    game.bullets.forEach(bullet => {
        if (bullet.direction === 'down') {
            const bulletRect = {
                x: bullet.x,
                y: bullet.y,
                width: bullet.width,
                height: bullet.height
            };
            if (checkCollision(playerRect, bulletRect)) {
                game.player.health--;
                if (game.player.health <= 0) {
                    game.gameOver = true;
                }
            }
        }
    });

    // Spawn powerups
    if (now - game.lastPowerupSpawn > game.powerupSpawnRate) {
        const types = ['rapidFire', 'invincible', 'health'];
        game.powerups.push(new Powerup(
            Math.random() * (canvas.width - 30),
            Math.random() * (canvas.height - 30),
            types[Math.floor(Math.random() * types.length)]
        ));
        game.lastPowerupSpawn = now;
    }

    // Draw and check powerups
    game.powerups = game.powerups.filter(powerup => {
        // Check collision with player
        const powerupRect = {
            x: powerup.x,
            y: powerup.y,
            width: powerup.width,
            height: powerup.height
        };
        
        if (checkCollision(playerRect, powerupRect)) {
            // Apply powerup effect
            switch(powerup.type) {
                case 'rapidFire':
                    game.fireRate = 100;
                    setTimeout(() => game.fireRate = 200, 5000);
                    break;
                case 'invincible':
                    game.player.color = 'gold';
                    setTimeout(() => game.player.color = 'green', 5000);
                    break;
                case 'health':
                    game.player.health = Math.min(3, game.player.health + 1);
                    break;
            }
            return false;
        }
        
        powerup.draw();
        return true;
    });

    // Draw player
    ctx.fillStyle = game.player.color;
    ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);

    // Draw health and score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Health: ${game.player.health}`, 20, 30);
    ctx.fillText(`Score: ${game.score}`, 20, 60);

    // Game over screen
    if (game.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
        return;
    }

    requestAnimationFrame(update);
}

// Start the game
update();
