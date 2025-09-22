// Mobile Fix - Ensures cart movement works on all devices
(function() {
    console.log('Applying mobile fixes...');

    // Wait for game to load
    const fixInterval = setInterval(() => {
        if (window.game && window.game.canvas) {
            clearInterval(fixInterval);
            applyMobileFix();
        }
    }, 100);

    function applyMobileFix() {
        const game = window.game;
        const canvas = game.canvas;

        console.log('Mobile fix: Game found, applying patches...');

        // Remove all existing touch listeners
        const newCanvas = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(newCanvas, canvas);
        game.canvas = newCanvas;
        game.ctx = newCanvas.getContext('2d');

        // Store touch state
        let touchActive = false;
        let lastTouchX = 0;

        // Simple touch handler that WILL work
        function handleGameTouch(e) {
            if (!game.gameActive || game.isPaused) return;

            let clientX, clientY;

            // Get touch coordinates
            if (e.type.includes('touch')) {
                if (e.touches && e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else if (e.changedTouches && e.changedTouches.length > 0) {
                    clientX = e.changedTouches[0].clientX;
                    clientY = e.changedTouches[0].clientY;
                } else {
                    return;
                }
            } else if (e.type.includes('pointer')) {
                clientX = e.clientX;
                clientY = e.clientY;
            } else if (e.type.includes('mouse')) {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            // Get canvas bounds
            const rect = newCanvas.getBoundingClientRect();

            // Calculate position on canvas
            const canvasX = ((clientX - rect.left) / rect.width) * newCanvas.width;
            const canvasY = ((clientY - rect.top) / rect.height) * newCanvas.height;

            // Only move if in play area (not on UI buttons)
            if (canvasY < newCanvas.height - 90) {
                // Calculate cart position
                const cartX = Math.max(0, Math.min(canvasX - game.cart.width/2, newCanvas.width - game.cart.width));

                // DIRECTLY set cart position - no smooth movement on mobile
                game.cart.x = cartX;
                game.cart.targetX = cartX;

                // Debug
                console.log(`Touch at ${clientX},${clientY} -> Canvas ${canvasX},${canvasY} -> Cart ${cartX}`);

                // Update debug display
                if (window.updateMobileDebug) {
                    window.updateMobileDebug({
                        touch: { x: clientX, y: clientY },
                        canvas: { x: canvasX, y: canvasY },
                        cart: { x: cartX }
                    });
                }
            }
        }

        // Add NEW touch handlers
        newCanvas.addEventListener('touchstart', function(e) {
            if (e.cancelable) e.preventDefault();
            touchActive = true;
            handleGameTouch(e);
        }, { passive: false });

        newCanvas.addEventListener('touchmove', function(e) {
            if (e.cancelable) e.preventDefault();
            if (touchActive) {
                handleGameTouch(e);
            }
        }, { passive: false });

        newCanvas.addEventListener('touchend', function(e) {
            if (e.cancelable) e.preventDefault();
            touchActive = false;
        }, { passive: false });

        // Add pointer events for Windows/modern browsers
        newCanvas.addEventListener('pointerdown', function(e) {
            if (e.pointerType === 'touch') {
                e.preventDefault();
                touchActive = true;
                handleGameTouch(e);
            }
        });

        newCanvas.addEventListener('pointermove', function(e) {
            if (e.pointerType === 'touch' && touchActive) {
                e.preventDefault();
                handleGameTouch(e);
            }
        });

        newCanvas.addEventListener('pointerup', function(e) {
            if (e.pointerType === 'touch') {
                touchActive = false;
            }
        });

        // Also add mouse for testing on desktop
        newCanvas.addEventListener('mousedown', function(e) {
            touchActive = true;
            handleGameTouch(e);
        });

        newCanvas.addEventListener('mousemove', function(e) {
            if (touchActive) {
                handleGameTouch(e);
            }
        });

        newCanvas.addEventListener('mouseup', function(e) {
            touchActive = false;
        });

        // Override the game's updateAndDrawCart to ensure immediate movement
        const originalUpdate = game.updateAndDrawCart.bind(game);
        game.updateAndDrawCart = function() {
            // Skip smooth movement on mobile - cart should already be at position
            const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            if (!isMobile) {
                // Only do smooth movement on desktop
                originalUpdate();
            } else {
                // On mobile, just draw the cart at its current position
                const ctx = this.ctx;

                // Bounce animation
                if (this.cart.bounce > 0) {
                    this.cart.bounce -= 0.1;
                }

                const bounceY = this.cart.y - this.cart.bounce * 5;

                // Draw cart based on skin
                ctx.save();
                ctx.translate(this.cart.x + this.cart.width/2, bounceY + this.cart.height/2);

                // Draw cart body
                const gradient = ctx.createLinearGradient(-40, -30, 40, 30);

                switch(this.cartSkin) {
                    case 'golden':
                        gradient.addColorStop(0, '#FFD700');
                        gradient.addColorStop(1, '#FFA500');
                        break;
                    case 'diamond':
                        gradient.addColorStop(0, '#B9F2FF');
                        gradient.addColorStop(1, '#00D4FF');
                        break;
                    case 'rainbow':
                        gradient.addColorStop(0, '#FF0000');
                        gradient.addColorStop(0.33, '#00FF00');
                        gradient.addColorStop(0.66, '#0000FF');
                        gradient.addColorStop(1, '#FF00FF');
                        break;
                    default:
                        gradient.addColorStop(0, '#8B4513');
                        gradient.addColorStop(1, '#654321');
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(-40, -20, 80, 40);

                // Draw pot shape
                ctx.beginPath();
                ctx.moveTo(-35, -20);
                ctx.lineTo(-40, 20);
                ctx.lineTo(40, 20);
                ctx.lineTo(35, -20);
                ctx.closePath();
                ctx.fill();

                // Draw wheels
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(-25, 25, 10, 0, Math.PI * 2);
                ctx.arc(25, 25, 10, 0, Math.PI * 2);
                ctx.fill();

                // Draw coin pile in cart
                if (this.cart.collectedCoins > 0) {
                    ctx.fillStyle = '#FFD700';
                    const coinHeight = Math.min(this.cart.collectedCoins * 2, 30);
                    ctx.fillRect(-30, -20 - coinHeight, 60, coinHeight);
                }

                // Draw rim
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 3;
                ctx.strokeRect(-42, -22, 84, 8);

                ctx.restore();
            }
        };

        // Disable touch-action on canvas via CSS
        newCanvas.style.touchAction = 'none';
        newCanvas.style.webkitTouchCallout = 'none';
        newCanvas.style.webkitUserSelect = 'none';
        newCanvas.style.userSelect = 'none';

        console.log('Mobile fix applied successfully!');

        // Add visual indicator that fix is active
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: #00ff00;
            color: black;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 10000;
        `;
        indicator.textContent = 'Mobile Fix Active ✓';
        document.body.appendChild(indicator);

        // Hide indicator after 3 seconds
        setTimeout(() => indicator.remove(), 3000);
    }

    // Export debug function
    window.updateMobileDebug = function(data) {
        const debugDiv = document.getElementById('mobileDebug');
        if (debugDiv) {
            const extraInfo = document.createElement('div');
            extraInfo.style.cssText = 'border-top: 1px solid #666; margin-top: 5px; padding-top: 5px; color: #ffff00;';
            extraInfo.innerHTML = `
                Fix Active<br>
                Touch: ${Math.round(data.touch.x)},${Math.round(data.touch.y)}<br>
                Canvas: ${Math.round(data.canvas.x)},${Math.round(data.canvas.y)}<br>
                Cart: ${Math.round(data.cart.x)}
            `;

            const existing = debugDiv.querySelector('.fix-info');
            if (existing) {
                existing.innerHTML = extraInfo.innerHTML;
            } else {
                extraInfo.className = 'fix-info';
                debugDiv.appendChild(extraInfo);
            }
        }
    };
})();