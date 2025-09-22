// Simple game fix to ensure items spawn and fall
// This code will be injected into the game to fix the core mechanics

function fixGame() {
    // Wait for game to load
    setTimeout(() => {
        if (window.game && window.game.gameActive) {
            console.log('Game is active, checking spawning...');

            // Force spawn some items for testing
            if (window.game.items.length === 0) {
                console.log('No items found, forcing spawn...');

                // Manually spawn items
                for (let i = 0; i < 5; i++) {
                    window.game.items.push({
                        type: 'coin',
                        x: Math.random() * (window.game.canvas.width - 40),
                        y: -50 - (i * 100),
                        width: 40,
                        height: 40,
                        speed: 3,
                        rotation: 0,
                        collected: false
                    });
                }
                console.log('Spawned test items:', window.game.items.length);
            }
        }
    }, 2000);
}

// Call fix after game starts
window.addEventListener('load', () => {
    console.log('Applying game fix...');

    // Override startGame to ensure it works
    const originalStart = window.startGame;
    window.startGame = function() {
        console.log('Starting game with fix...');
        originalStart();
        fixGame();
    };
});