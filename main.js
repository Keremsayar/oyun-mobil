// Basic Three.js 2D setup
let GAME_WIDTH = window.innerWidth;
let GAME_HEIGHT = window.innerHeight;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
    GAME_WIDTH / -2, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT / -2, 0.1, 1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
document.getElementById('gameContainer').appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    GAME_WIDTH = window.innerWidth;
    GAME_HEIGHT = window.innerHeight;
    camera.left = GAME_WIDTH / -2;
    camera.right = GAME_WIDTH / 2;
    camera.top = GAME_HEIGHT / 2;
    camera.bottom = GAME_HEIGHT / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
});

camera.position.z = 10;

// Game objects arrays
let player, bullets = [], enemies = [];
let score = 0;
let gameOver = false;
let btcShown = false;
let ahmetEventActive = false;
let ahmetPlane = null;
let ahmetEventStage = 0; // 0: not started, 1: countdown, 2: plane, 3: message, 4: resume
let ahmetPlaneDirection = 1; // 1 for right, -1 for left

// Trophy notifications
const trophies = [
    { score: 5, text: 'Kıvanç is watching you 👀' },
    { score: 10, text: 'Selim approved this bug ✅' },
    { score: 15, text: 'Hidden level: Ahmet’s basement unlocked' },
    { score: 20, text: 'BEST SCORE EVER REACHED BY KEREM' },
];
let shownTrophies = {};

function showNotification(message) {
    const notif = document.getElementById('notification');
    notif.innerText = message;
    notif.style.display = 'block';
    notif.style.opacity = '1';
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => {
            notif.style.display = 'none';
        }, 500);
    }, 4000);
}

function showCountdown(callback) {
    const countdownDiv = document.getElementById('countdown');
    const countdownText = document.getElementById('countdownText');
    countdownDiv.style.display = 'flex';
    let count = 3;
    countdownText.innerText = count;
    countdownText.style.opacity = '1';
    function next() {
        if (count > 1) {
            setTimeout(() => {
                count--;
                countdownText.innerText = count;
                next();
            }, 900);
        } else {
            setTimeout(() => {
                countdownDiv.style.display = 'none';
                if (callback) callback();
            }, 900);
        }
    }
    next();
}

function spawnAhmetPlane() {
    // Airliner-style plane based on user photo
    const group = new THREE.Group();
    // Fuselage (main body)
    const fuselageGeometry = new THREE.CylinderGeometry(7, 7, 60, 24);
    const fuselageMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.rotation.z = Math.PI / 2;
    group.add(fuselage);
    // Nose (rounded front)
    const noseGeometry = new THREE.SphereGeometry(7, 16, 16);
    const noseMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.x = 30;
    group.add(nose);
    // Cockpit windows (black)
    const cockpitGeometry = new THREE.BoxGeometry(4, 2, 1);
    const cockpitMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.x = 34;
    cockpit.position.y = 2;
    group.add(cockpit);
    // Windows (row of small circles)
    for (let i = -22; i <= 22; i += 6) {
        const windowGeometry = new THREE.CircleGeometry(0.8, 8);
        const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const win = new THREE.Mesh(windowGeometry, windowMaterial);
        win.position.x = i;
        win.position.y = 4;
        win.position.z = 7.5;
        group.add(win);
    }
    // Wings (swept-back)
    const wingGeometry = new THREE.BoxGeometry(30, 2, 10);
    const wingMaterial = new THREE.MeshBasicMaterial({ color: 0xe0e0e0 });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.x = -5;
    leftWing.position.y = -4;
    leftWing.position.z = -10;
    leftWing.rotation.y = Math.PI / 8;
    leftWing.rotation.x = Math.PI / 16;
    group.add(leftWing);
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.x = -5;
    rightWing.position.y = -4;
    rightWing.position.z = 10;
    rightWing.rotation.y = -Math.PI / 8;
    rightWing.rotation.x = -Math.PI / 16;
    group.add(rightWing);
    // Engines (under wings)
    const engineGeometry = new THREE.CylinderGeometry(2, 2, 6, 12);
    const engineMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.position.x = -10;
    leftEngine.position.y = -7;
    leftEngine.position.z = -10;
    leftEngine.rotation.z = Math.PI / 2;
    group.add(leftEngine);
    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.position.x = -10;
    rightEngine.position.y = -7;
    rightEngine.position.z = 10;
    rightEngine.rotation.z = Math.PI / 2;
    group.add(rightEngine);
    // Tail fin (vertical, blue)
    const tailFinGeometry = new THREE.BoxGeometry(2, 14, 10);
    const tailFinMaterial = new THREE.MeshBasicMaterial({ color: 0x1565c0 });
    const tailFin = new THREE.Mesh(tailFinGeometry, tailFinMaterial);
    tailFin.position.x = -30;
    tailFin.position.y = 10;
    group.add(tailFin);
    // Tail stabilizers (horizontal, blue)
    const tailStabGeometry = new THREE.BoxGeometry(12, 2, 4);
    const tailStabMaterial = new THREE.MeshBasicMaterial({ color: 0x1565c0 });
    const leftStab = new THREE.Mesh(tailStabGeometry, tailStabMaterial);
    leftStab.position.x = -32;
    leftStab.position.y = 4;
    leftStab.position.z = -6;
    leftStab.rotation.y = Math.PI / 12;
    group.add(leftStab);
    const rightStab = new THREE.Mesh(tailStabGeometry, tailStabMaterial);
    rightStab.position.x = -32;
    rightStab.position.y = 4;
    rightStab.position.z = 6;
    rightStab.rotation.y = -Math.PI / 12;
    group.add(rightStab);
    group.position.set(0, 0, 0);
    scene.add(group);
    return group;
}

// Player setup
function createPlayer() {
    // Spaceship: triangle
    const shape = new THREE.Shape();
    shape.moveTo(0, 30);
    shape.lineTo(-20, -20);
    shape.lineTo(20, -20);
    shape.lineTo(0, 30);
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    player = new THREE.Mesh(geometry, material);
    player.position.y = -GAME_HEIGHT / 2 + 50;
    scene.add(player);
}

// Bullet setup
function createBullet(x, y) {
    const geometry = new THREE.BoxGeometry(8, 20, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(geometry, material);
    bullet.position.set(x, y + 20, 0);
    scene.add(bullet);
    bullets.push(bullet);
}

// Enemy setup
function createEnemy() {
    // Satan: red circle with horns, eyes, and mouth
    const group = new THREE.Group();
    // Head
    const headGeometry = new THREE.CircleGeometry(20, 32);
    const headMaterial = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    group.add(head);
    // Horns (curved, more prominent)
    const hornMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftHorn = new THREE.Mesh(new THREE.CylinderGeometry(2, 6, 18, 12), hornMaterial);
    leftHorn.position.set(-13, 22, 0);
    leftHorn.rotation.z = Math.PI * 0.5;
    leftHorn.rotation.y = Math.PI * 0.2;
    group.add(leftHorn);
    const rightHorn = new THREE.Mesh(new THREE.CylinderGeometry(2, 6, 18, 12), hornMaterial);
    rightHorn.position.set(13, 22, 0);
    rightHorn.rotation.z = -Math.PI * 0.5;
    rightHorn.rotation.y = -Math.PI * 0.2;
    group.add(rightHorn);
    // Eyes
    const eyeGeometry = new THREE.CircleGeometry(2.5, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-6, 8, 2);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(6, 8, 2);
    group.add(rightEye);
    // Mouth (smile with fangs)
    const mouthShape = new THREE.Shape();
    mouthShape.moveTo(-7, -5);
    mouthShape.quadraticCurveTo(0, -12, 7, -5);
    const mouthGeometry = new THREE.BufferGeometry().setFromPoints(mouthShape.getPoints(20));
    const mouthMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const mouth = new THREE.Line(mouthGeometry, mouthMaterial);
    mouth.position.z = 2;
    group.add(mouth);
    // Fangs
    const fangGeometry = new THREE.BoxGeometry(1.5, 4, 1);
    const fangMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftFang = new THREE.Mesh(fangGeometry, fangMaterial);
    leftFang.position.set(-3, -8, 2);
    group.add(leftFang);
    const rightFang = new THREE.Mesh(fangGeometry, fangMaterial);
    rightFang.position.set(3, -8, 2);
    group.add(rightFang);
    group.position.x = (Math.random() - 0.5) * (GAME_WIDTH - 80);
    group.position.y = GAME_HEIGHT / 2 - 40;
    scene.add(group);
    enemies.push(group);
}

// Controls
let left = false, right = false, space = false;
document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') left = true;
    if (e.code === 'ArrowRight') right = true;
    if (e.code === 'Space') space = true;
});
document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') left = false;
    if (e.code === 'ArrowRight') right = false;
    if (e.code === 'Space') space = false;
});
// Controller buttons for mobile
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnShoot = document.getElementById('btnShoot');
if (btnLeft && btnRight && btnShoot) {
    btnLeft.addEventListener('touchstart', e => { e.preventDefault(); left = true; });
    btnLeft.addEventListener('touchend', e => { e.preventDefault(); left = false; });
    btnRight.addEventListener('touchstart', e => { e.preventDefault(); right = true; });
    btnRight.addEventListener('touchend', e => { e.preventDefault(); right = false; });
    btnShoot.addEventListener('touchstart', e => { e.preventDefault(); space = true; });
    btnShoot.addEventListener('touchend', e => { e.preventDefault(); space = false; });
}

// Game loop
let lastEnemySpawn = 0;
let lastShot = 0;
function animate(time) {
    // Special event: Ahmet plane
    if (ahmetEventActive) {
        // Only handle the plane, no other enemies or movement
        if (ahmetEventStage === 2 && ahmetPlane) {
            // Move the plane slowly left and right
            ahmetPlane.position.x += 2 * ahmetPlaneDirection;
            if (ahmetPlane.position.x > GAME_WIDTH / 2 - 40) ahmetPlaneDirection = -1;
            if (ahmetPlane.position.x < -GAME_WIDTH / 2 + 40) ahmetPlaneDirection = 1;
            // Plane stays in the middle, can be shot
            for (let j = bullets.length - 1; j >= 0; j--) {
                if (Math.abs(ahmetPlane.position.x - bullets[j].position.x) < 30 &&
                    Math.abs(ahmetPlane.position.y - bullets[j].position.y) < 20) {
                    scene.remove(ahmetPlane);
                    ahmetPlane = null;
                    ahmetEventStage = 3;
                    document.getElementById('ahmetMessage').style.display = 'flex';
                    ahmetPlaneDirection = 1; // reset for next time
                    setTimeout(() => {
                        document.getElementById('ahmetMessage').style.display = 'none';
                        showCountdown(() => {
                            ahmetEventActive = false;
                            ahmetEventStage = 0;
                            requestAnimationFrame(animate); // resume game loop
                        });
                    }, 4000);
                    return;
                }
            }
            // Player movement and shooting allowed
            if (left && player.position.x > -GAME_WIDTH / 2 + 40) player.position.x -= 10;
            if (right && player.position.x < GAME_WIDTH / 2 - 40) player.position.x += 10;
            if (space && time - lastShot > 300) {
                createBullet(player.position.x, player.position.y);
                lastShot = time;
            }
            // Move bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].position.y += 20;
                if (bullets[i].position.y > GAME_HEIGHT / 2) {
                    scene.remove(bullets[i]);
                    bullets.splice(i, 1);
                }
            }
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
            return;
        }
        // Freeze game (no normal animate)
        renderer.render(scene, camera);
        return;
    }
    if (gameOver) return;
    requestAnimationFrame(animate);

    // Player movement
    if (left && player.position.x > -GAME_WIDTH / 2 + 40) player.position.x -= 10;
    if (right && player.position.x < GAME_WIDTH / 2 - 40) player.position.x += 10;

    // Shooting
    if (space && time - lastShot > 300) {
        createBullet(player.position.x, player.position.y);
        lastShot = time;
    }

    // Move bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].position.y += 20;
        if (bullets[i].position.y > GAME_HEIGHT / 2) {
            scene.remove(bullets[i]);
            bullets.splice(i, 1);
        }
    }

    // Spawn enemies
    if (time - lastEnemySpawn > 1000) {
        createEnemy();
        lastEnemySpawn = time;
    }

    // Move enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].position.y -= 4;
        if (enemies[i].position.y < -GAME_HEIGHT / 2) {
            scene.remove(enemies[i]);
            enemies.splice(i, 1);
            endGame();
        }
    }

    // Collision detection
    for (let i = enemies.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (Math.abs(enemies[i].position.x - bullets[j].position.x) < 30 &&
                Math.abs(enemies[i].position.y - bullets[j].position.y) < 20) {
                scene.remove(enemies[i]);
                scene.remove(bullets[j]);
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                score++;
                document.getElementById('score').innerText = 'Score: ' + score;
                // Trophy notification logic
                for (const trophy of trophies) {
                    if (score === trophy.score && !shownTrophies[trophy.score]) {
                        showNotification(trophy.text);
                        shownTrophies[trophy.score] = true;
                    }
                }
                // BTC message logic
                if (score === 25 && !btcShown) {
                    btcShown = true;
                    gameOver = true;
                    document.getElementById('btcMessage').style.display = 'flex';
                    document.getElementById('notification').style.display = 'none';
                    document.getElementById('gameOver').style.display = 'none';
                }
                // Ahmet event trigger
                if (score === 23 && !ahmetEventActive) {
                    ahmetEventActive = true;
                    ahmetEventStage = 1;
                    // Remove all enemies
                    for (let i = enemies.length - 1; i >= 0; i--) {
                        scene.remove(enemies[i]);
                        enemies.splice(i, 1);
                    }
                    // Freeze game and show countdown
                    showCountdown(() => {
                        ahmetEventStage = 2;
                        ahmetPlane = spawnAhmetPlane();
                        requestAnimationFrame(animate); // resume game loop for plane event
                    });
                    return;
                }
                break;
            }
        }
    }

    // Player collision
    for (let i = 0; i < enemies.length; i++) {
        if (Math.abs(enemies[i].position.x - player.position.x) < 40 &&
            Math.abs(enemies[i].position.y - player.position.y) < 20) {
            endGame();
        }
    }

    renderer.render(scene, camera);
}

function endGame() {
    gameOver = true;
    document.getElementById('gameOver').style.display = 'block';
}

// Remove responsive resize for fixed play area
// Start game
createPlayer();
animate(0); 