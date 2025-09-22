// Mobile Debug Script - Helps identify touch issues
(function() {
    console.log('Mobile Debug Active');

    // Detect device type
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    console.log('Device Info:', {
        isMobile,
        isIOS,
        isAndroid,
        userAgent: navigator.userAgent,
        touchSupport: 'ontouchstart' in window,
        maxTouchPoints: navigator.maxTouchPoints
    });

    // Create debug overlay
    const debugDiv = document.createElement('div');
    debugDiv.id = 'mobileDebug';
    debugDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: #00ff00;
        padding: 10px;
        font-family: monospace;
        font-size: 10px;
        z-index: 10000;
        max-width: 200px;
        border-radius: 5px;
        pointer-events: none;
    `;
    document.body.appendChild(debugDiv);

    let touchInfo = {
        lastX: 0,
        lastY: 0,
        touches: 0,
        events: []
    };

    // Track all touch events
    document.addEventListener('touchstart', (e) => {
        touchInfo.touches = e.touches.length;
        if (e.touches.length > 0) {
            touchInfo.lastX = Math.round(e.touches[0].clientX);
            touchInfo.lastY = Math.round(e.touches[0].clientY);
        }
        touchInfo.events.push('start');
        updateDebug();
    }, true);

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            touchInfo.lastX = Math.round(e.touches[0].clientX);
            touchInfo.lastY = Math.round(e.touches[0].clientY);
        }
        touchInfo.events.push('move');
        updateDebug();
    }, true);

    document.addEventListener('touchend', (e) => {
        touchInfo.touches = e.touches.length;
        touchInfo.events.push('end');
        updateDebug();
    }, true);

    function updateDebug() {
        // Keep only last 5 events
        if (touchInfo.events.length > 5) {
            touchInfo.events.shift();
        }

        debugDiv.innerHTML = `
            <strong>Touch Debug</strong><br>
            Device: ${isMobile ? (isIOS ? 'iOS' : isAndroid ? 'Android' : 'Mobile') : 'Desktop'}<br>
            Pos: ${touchInfo.lastX}, ${touchInfo.lastY}<br>
            Touches: ${touchInfo.touches}<br>
            Events: ${touchInfo.events.join(', ')}<br>
            Cart: ${window.game ? Math.round(window.game.cart.x) : 'N/A'}
        `;
    }

    // Check if game is loaded
    setInterval(() => {
        if (window.game) {
            const gameInfo = document.createElement('div');
            gameInfo.style.cssText = 'border-top: 1px solid #666; margin-top: 5px; padding-top: 5px;';
            gameInfo.innerHTML = `
                Game: ${window.game.gameActive ? 'Active' : 'Inactive'}<br>
                Score: ${window.game.score}<br>
                Hearts: ${window.game.hearts}
            `;

            if (!debugDiv.querySelector('div')) {
                debugDiv.appendChild(gameInfo);
            } else {
                debugDiv.querySelector('div').innerHTML = gameInfo.innerHTML;
            }
        }
    }, 500);

    // Add button to toggle debug
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '🐛';
    toggleBtn.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        background: rgba(0,0,0,0.5);
        color: white;
        border: 1px solid #666;
        border-radius: 5px;
        z-index: 10001;
        font-size: 16px;
    `;
    toggleBtn.onclick = () => {
        debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
    };
    document.body.appendChild(toggleBtn);

    console.log('Mobile debug overlay created');
})();