// Game patch to fix all remaining issues
// This will be injected into the game to fix mobile controls and add missing features

(function() {
    console.log('Applying game patches...');

    // Wait for game to be ready
    const patchInterval = setInterval(() => {
        if (window.game && window.game.canvas) {
            clearInterval(patchInterval);
            applyPatches();
        }
    }, 100);

    function applyPatches() {
        const game = window.game;

        // Add missing properties if not present
        if (game.missedItems === undefined) {
            game.missedItems = 0;
            game.maxMissedItems = 25;
            game.movementPenalty = 0;
            game.lastScore = parseInt(localStorage.getItem('lastScore') || '0');
            game.highScore = parseInt(localStorage.getItem('highScore') || '0');
        }

        // Fix mobile touch handling
        const canvas = game.canvas;

        // Remove existing listeners
        canvas.removeEventListener('touchstart', game.handleTouch);
        canvas.removeEventListener('touchmove', game.handleTouch);
        canvas.removeEventListener('touchend', game.handleTouch);

        // Add improved touch handlers
        let touchActive = false;

        canvas.addEventListener('touchstart', function(e) {
            if (!game.gameActive || game.isPaused) return;

            e.preventDefault();
            touchActive = true;

            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;

            // Move cart to touch position
            game.cart.targetX = Math.max(0, Math.min(x - game.cart.width/2, canvas.width - game.cart.width));
            game.cart.x = game.cart.targetX; // Immediate movement
        }, { passive: false });

        canvas.addEventListener('touchmove', function(e) {
            if (!game.gameActive || game.isPaused || !touchActive) return;

            e.preventDefault();

            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;

            // Update cart position
            const targetX = Math.max(0, Math.min(x - game.cart.width/2, canvas.width - game.cart.width));

            // Apply movement penalty if missing too many items
            if (game.movementPenalty > 0) {
                const diff = targetX - game.cart.x;
                game.cart.x += diff * (1 - game.movementPenalty) * 0.5;
                game.cart.targetX = game.cart.x;
            } else {
                game.cart.x = targetX;
                game.cart.targetX = targetX;
            }
        }, { passive: false });

        canvas.addEventListener('touchend', function(e) {
            touchActive = false;
        }, { passive: false });

        // Override updateHUD to show all info
        const originalUpdateHUD = game.updateHUD.bind(game);
        game.updateHUD = function() {
            originalUpdateHUD();

            // Add score display
            let scoreDisplay = document.getElementById('scoreDisplay');
            if (!scoreDisplay) {
                const container = document.getElementById('gameContainer');
                scoreDisplay = document.createElement('div');
                scoreDisplay.id = 'scoreDisplay';
                scoreDisplay.style.cssText = `
                    position: absolute;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    text-align: center;
                    color: white;
                    font-weight: bold;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    z-index: 50;
                    pointer-events: none;
                `;
                container.appendChild(scoreDisplay);
            }
            scoreDisplay.innerHTML = `
                <div style="font-size: 28px; color: #FFD700;">Score: ${this.score}</div>
                <div style="font-size: 16px; color: #FFA500;">Last: ${this.lastScore} | Best: ${this.highScore}</div>
            `;

            // Add missed items indicator
            let missedDisplay = document.getElementById('missedItemsDisplay');
            if (!missedDisplay) {
                const container = document.getElementById('gameContainer');
                missedDisplay = document.createElement('div');
                missedDisplay.id = 'missedItemsDisplay';
                missedDisplay.style.cssText = `
                    position: absolute;
                    bottom: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 280px;
                    background: rgba(0,0,0,0.8);
                    border-radius: 10px;
                    padding: 10px;
                    text-align: center;
                    z-index: 50;
                    pointer-events: none;
                `;
                container.appendChild(missedDisplay);
            }

            const missedPercent = (this.missedItems / this.maxMissedItems) * 100;
            const barColor = missedPercent > 75 ? '#FF4444' : missedPercent > 50 ? '#FFA500' : '#44FF44';
            const slowdownWarning = this.missedItems > this.maxMissedItems * 0.8;

            missedDisplay.innerHTML = `
                <div style="color: white; font-size: 14px; margin-bottom: 5px;">
                    Missed Items: ${this.missedItems}/${this.maxMissedItems}
                </div>
                <div style="width: 100%; height: 20px; background: rgba(255,255,255,0.2); border-radius: 10px; overflow: hidden;">
                    <div style="width: ${Math.min(100, missedPercent)}%; height: 100%; background: ${barColor}; transition: width 0.3s; box-shadow: 0 0 10px ${barColor};"></div>
                </div>
                ${slowdownWarning ? '<div style="color: #FF4444; font-size: 12px; margin-top: 5px; animation: pulse 1s infinite;">⚠️ Cart slowing down!</div>' : ''}
            `;
        };

        // Fix bomb damage to reduce hearts
        const originalCheckCollisions = game.checkCollisions.bind(game);
        game.checkCollisions = function() {
            const cartBounds = {
                x: this.cart.x - 5,
                y: this.cart.y - 10,
                width: this.cart.width + 10,
                height: this.cart.height + 10
            };

            for (let i = this.items.length - 1; i >= 0; i--) {
                const item = this.items[i];

                // Check collision
                if (item.x < cartBounds.x + cartBounds.width &&
                    item.x + item.width > cartBounds.x &&
                    item.y < cartBounds.y + cartBounds.height &&
                    item.y + item.height > cartBounds.y) {

                    // Handle collection
                    if (item.type === 'bomb') {
                        // Reduce hearts instead of instant game over
                        this.hearts--;
                        this.createExplosion(item.x + item.width/2, item.y + item.height/2);
                        this.playSound('explosion');

                        // Flash screen red
                        const flash = document.createElement('div');
                        flash.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(255,0,0,0.4);
                            pointer-events: none;
                            z-index: 9999;
                            animation: flashRed 0.5s;
                        `;
                        document.body.appendChild(flash);
                        setTimeout(() => flash.remove(), 500);

                        if (this.hearts <= 0) {
                            this.gameOver('No hearts left!');
                        }
                    } else {
                        // Collect other items normally
                        item.collected = true;

                        // Add score based on item type
                        const points = {
                            'coin': 10,
                            'diamond': 50,
                            'star': 100,
                            'heart': 0,
                            'magnet': 0,
                            'multiplier': 0
                        };

                        const basePoints = points[item.type] || 10;
                        const multiplier = this.powerUps.multiplier > 0 ? 2 : 1;
                        this.score += basePoints * multiplier;

                        // Handle special items
                        if (item.type === 'coin') {
                            this.coins++;
                        } else if (item.type === 'heart') {
                            this.hearts = Math.min(5, this.hearts + 1);
                        }

                        // Update combo
                        this.combo++;

                        // Play sound
                        this.playSound('coin');

                        // Create particle effect
                        this.createParticles(item.x + item.width/2, item.y + item.height/2, item.type);
                    }

                    // Remove item
                    this.items.splice(i, 1);
                }
            }
        };

        // Override gameOver to save scores
        const originalGameOver = game.gameOver.bind(game);
        game.gameOver = function(reason = '') {
            // Save scores
            localStorage.setItem('lastScore', this.score.toString());
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('highScore', this.score.toString());
            }

            // Update leaderboard
            let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
            const playerName = localStorage.getItem('playerName') || 'Player';
            const existingIndex = leaderboard.findIndex(e => e.name === playerName);

            if (existingIndex >= 0) {
                leaderboard[existingIndex].score = Math.max(leaderboard[existingIndex].score, this.score);
                leaderboard[existingIndex].date = new Date().toLocaleDateString();
            } else {
                leaderboard.push({
                    name: playerName,
                    score: this.score,
                    date: new Date().toLocaleDateString()
                });
            }

            leaderboard.sort((a, b) => b.score - a.score);
            localStorage.setItem('leaderboard', JSON.stringify(leaderboard));

            // Call original game over
            originalGameOver(reason);

            // Show reason if provided
            if (reason) {
                setTimeout(() => {
                    const menuOverlay = document.getElementById('menuOverlay');
                    const reasonDiv = document.createElement('div');
                    reasonDiv.style.cssText = `
                        color: #FF4444;
                        font-size: 20px;
                        margin: 10px;
                        font-weight: bold;
                    `;
                    reasonDiv.textContent = reason;
                    menuOverlay.insertBefore(reasonDiv, menuOverlay.firstChild);
                }, 100);
            }
        };

        console.log('Game patches applied successfully!');
    }
})();