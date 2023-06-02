const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const img = new Image();
let tileData = [];
let mouseX = 0;
let mouseY = 0;
let introDone = false;
let lastMoveTimestamp = 0;
const introTileCount = 10;  // number of tiles that participate in the intro
const maxDistortion = 240;
const easing = 0.5;
const radius = 3;  // Adjust the radius size as needed (in tiles)

function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

  for (let i = 0; i < tileData.length; i++) {
      const tile = tileData[i];
      const tileCenterX = tile.x + tile.size / 2;
      const tileCenterY = tile.y + tile.size / 2;

      const distance = Math.sqrt((tileCenterX - mouseX) ** 2 + (tileCenterY - mouseY) ** 2);

      if (currentTime - lastMoveTimestamp > 200 || distance > radius * tile.size) {
          const targetDistortion = 0;
          tile.distortion += (targetDistortion - tile.distortion) * easing;
      } else {
          const distortion = (1 - distance / (radius * tile.size)) * maxDistortion;
          tile.distortion += (distortion - tile.distortion) * easing;
      }
  }
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

        // Draw red border around the tile
        context.strokeStyle = 'red';
        context.lineWidth = 2;
        context.strokeRect(tile.x, tile.y, tile.size, tile.size);
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

            if (introDone) {
                updateTiles();
            }
        });

        // Set initial distortion for intro animation
        for (let i = 0; i < introTileCount; i++) {
            const tileIndex = Math.floor(Math.random() * tileData.length);
            const tile = tileData[tileIndex];
            tile.distortion = maxDistortion * (Math.random() > 0.5 ? 1 : -1);  // random direction
        }

        function introAnimation() {
            let introComplete = true;

            for (let i = 0; i < introTileCount; i++) {
                const tileIndex = Math.floor(Math.random() * tileData.length);
                const tile = tileData[tileIndex];
                const targetDistortion = 0;
                tile.distortion += (targetDistortion - tile.distortion) * easing;

                if (Math.abs(tile.distortion) > 1) {
                    introComplete = false;
                }
            }

            if (!introComplete) {
                requestAnimationFrame(introAnimation);
            } else {
                introDone = true;
            }
        }

        introAnimation();
        render();
    };
}


initialize();
