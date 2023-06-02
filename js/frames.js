const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const img = new Image();
let tileData = [];
let mouseX = 0;
let mouseY = 0;
let introDone = false;
let lastMoveTimestamp = 0;
let idleTimer = null;
const introTileCount = 240;  // number of tiles that participate in the intro
const maxDistortion = 340;
const easing = 0.075;  // slower easing
const easingFast = 0.3;  // faster easing for mouse interaction
const radius = 5;  // Adjust the radius size as needed (in tiles)
const idleTimeout = 2000;  // 2 seconds idle timeout

function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3);
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = img.height * (canvas.width / img.width);

    const numTiles = 20;  // Adjust this value for more or fewer tiles
    const tileSize = Math.floor(canvas.width / numTiles);

    tileData.length = 0;

    for (let tileY = 0; tileY < canvas.height; tileY += tileSize) {
        for (let tileX = 0; tileX < canvas.width; tileX += tileSize) {
            tileData.push({
                x: tileX,
                y: tileY,
                srcX: tileX * (img.width / canvas.width),
                srcY: tileY * (img.height / canvas.height),
                dist: 0,
                distortion: 0,
                size: tileSize,
                lastUpdate: performance.now(),
            });
        }
    }
}

function updateTiles() {
    const currentTime = performance.now();
    const timeDelta = currentTime - lastMoveTimestamp;

    let mouseIdle = false;

    // Check if the mouse is stationary for the idle timeout duration
    if (timeDelta >= idleTimeout) {
        mouseIdle = true;
    }

    for (let i = 0; i < tileData.length; i++) {
        const tile = tileData[i];
        const tileCenterX = tile.x + tile.size / 2;
        const tileCenterY = tile.y + tile.size / 2;

        const distance = Math.sqrt((tileCenterX - mouseX) ** 2 + (tileCenterY - mouseY) ** 2);

        let targetDistortion = 0;

        // Calculate the target distortion based on mouse proximity
        if (distance <= radius * tile.size) {
            targetDistortion = (1 - distance / (radius * tile.size)) * maxDistortion;
        }

        // Apply easing based on distance from mouse
        const easingSpeed = distance <= radius * tile.size ? easingFast : easing;
        tile.distortion += (targetDistortion - tile.distortion) * easingSpeed;

        // Apply idle distortion if the mouse is idle
        if (mouseIdle && introDone) {
            const elapsed = Math.min((currentTime - lastMoveTimestamp - idleTimeout) / 1000, 1);
            const eased = easeOutCubic(elapsed);
            tile.distortion += (0 - tile.distortion) * eased;
        }

        // Update the tile's last update timestamp
        tile.lastUpdate = currentTime;
    }

    requestAnimationFrame(updateTiles);
}

function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the undistorted image
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (let i = 0; i < tileData.length; i++) {
        const tile = tileData[i];
        const targetDistortion = tile.distortion;
        const elapsed = Math.min((performance.now() - tile.lastUpdate) / 1000, 1);
        const eased = easeInOutCubic(elapsed);
        tile.distortion += (targetDistortion - tile.distortion) * eased;

        // Draw the image within the tile, distorted by the mouse proximity
        context.drawImage(
            img,
            tile.srcX + tile.distortion,
            tile.srcY + tile.distortion,
            tile.size * (img.width / canvas.width),
            tile.size * (img.height / canvas.height),
            tile.x,
            tile.y,
            tile.size,
            tile.size
        );
    }

    requestAnimationFrame(render);
}

function initialize() {
    const images = ['01', '02', '03', '04'];
    const randomIndex = Math.floor(Math.random() * images.length);
    const randomImage = images[randomIndex];
    img.src = `./img/frame_film-hero-${randomImage}.jpg`;

    img.onload = function () {
        resizeCanvas();

        window.addEventListener('resize', resizeCanvas);

        canvas.addEventListener('mousemove', function (event) {
            const rect = canvas.getBoundingClientRect();

            mouseX = event.clientX - rect.left;
            mouseY = event.clientY - rect.top;
            lastMoveTimestamp = performance.now();
        });

        // Set initial distortion for intro animation
        for (let i = 0; i < introTileCount; i++) {
            const tileIndex = Math.floor(Math.random() * tileData.length);
            const tile = tileData[tileIndex];
            tile.distortion = maxDistortion * (Math.random() > 0.5 ? 1 : -1);  // random direction
        }

        introDone = true;
        updateTiles();
        render();
    };
}

initialize();
