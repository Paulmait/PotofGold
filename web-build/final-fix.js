// Final fixes for mobile and UI issues
(function() {
    console.log('Applying final fixes...');

    // Fix 1: Move missed items indicator to top-right so it doesn't block cart
    function fixMissedItemsPosition() {
        const missedDisplay = document.getElementById('missedItemsDisplay');
        if (missedDisplay) {
            missedDisplay.style.bottom = 'auto';
            missedDisplay.style.top = '120px';
            missedDisplay.style.right = '10px';
            missedDisplay.style.left = 'auto';
            missedDisplay.style.transform = 'none';
            missedDisplay.style.width = '200px';
            missedDisplay.style.fontSize = '12px';
            console.log('Moved missed items indicator to top-right');
        }
    }

    // Fix 2: Ensure game initialization on mobile
    function ensureGameInit() {
        // Check if game exists
        if (!window.game) {
            console.log('Game not found, initializing...');
            try {
                const game = new PotOfGoldGame();
                game.init();
                window.game = game;
                window.gameInstance = game;
                console.log('Game initialized via final-fix');
            } catch(error) {
                console.error('Failed to initialize game:', error);
                // Try again in 500ms
                setTimeout(ensureGameInit, 500);
            }
        } else {
            console.log('Game already initialized');
        }
    }

    // Fix 3: Make menu buttons work on mobile
    function fixMenuButtons() {
        const buttons = document.querySelectorAll('.menu-btn');
        buttons.forEach(button => {
            // Remove any existing listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            // Get the function name from onclick
            const onclickAttr = newButton.getAttribute('onclick');

            // Add both click and touch listeners
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (onclickAttr) {
                    try {
                        eval(onclickAttr);
                    } catch(err) {
                        console.error('Error executing:', onclickAttr, err);
                    }
                }
            });

            newButton.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (onclickAttr) {
                    try {
                        eval(onclickAttr);
                    } catch(err) {
                        console.error('Error executing:', onclickAttr, err);
                    }
                }
            });

            // Make buttons more touch-friendly
            newButton.style.minHeight = '50px';
            newButton.style.touchAction = 'manipulation';
            newButton.style.webkitTapHighlightColor = 'transparent';
        });
        console.log('Fixed menu buttons for mobile');
    }

    // Fix 4: Override startGame to ensure it works
    window.startGameFixed = function() {
        console.log('StartGame Fixed called');

        // Ensure game exists
        if (!window.game) {
            ensureGameInit();
            // Try again in a moment
            setTimeout(window.startGameFixed, 100);
            return;
        }

        // Hide menu
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) {
            menuOverlay.style.display = 'none';
            menuOverlay.classList.add('hidden');
        }

        // Show game UI
        const hud = document.querySelector('.game-hud');
        if (hud) hud.style.display = 'flex';

        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.style.display = 'flex';

        const actionButtons = document.getElementById('actionButtons');
        if (actionButtons) actionButtons.style.display = 'flex';

        // Start game
        try {
            window.game.start();
            console.log('Game started successfully');

            // Fix missed items position after game starts
            setTimeout(fixMissedItemsPosition, 100);
        } catch(error) {
            console.error('Error starting game:', error);
            alert('Error starting game. Please refresh the page.');
        }
    };

    // Override the original startGame
    if (window.startGame) {
        window.originalStartGame = window.startGame;
        window.startGame = window.startGameFixed;
    }

    // Fix 5: Monitor and fix missed items position continuously
    setInterval(function() {
        const missedDisplay = document.getElementById('missedItemsDisplay');
        if (missedDisplay) {
            // Check if it's in the wrong position
            if (missedDisplay.style.bottom === '100px' || missedDisplay.style.left === '50%') {
                fixMissedItemsPosition();
            }
        }
    }, 1000);

    // Apply fixes when DOM is ready
    function applyFixes() {
        ensureGameInit();
        fixMenuButtons();
        fixMissedItemsPosition();

        // Show success indicator
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: linear-gradient(45deg, #00ff00, #00cc00);
            color: black;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,255,0,0.3);
        `;
        indicator.textContent = '✅ All Fixes Applied';
        document.body.appendChild(indicator);

        setTimeout(() => indicator.remove(), 3000);
    }

    // Multiple ways to ensure fixes are applied
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFixes);
    } else {
        applyFixes();
    }

    // Also apply on first user interaction (for mobile)
    document.addEventListener('click', function firstClick() {
        applyFixes();
        document.removeEventListener('click', firstClick);
    }, { once: true });

    document.addEventListener('touchstart', function firstTouch() {
        applyFixes();
        document.removeEventListener('touchstart', firstTouch);
    }, { once: true });

    console.log('Final fixes loaded');
})();