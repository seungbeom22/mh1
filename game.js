const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 캔버스 크기 초기화
function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = canvas.offsetHeight;
}
window.addEventListener('resize', initCanvas);
initCanvas();

// 데이터 로드
let coins = parseInt(localStorage.getItem("coinsCat")) || 0;
let bestScore = parseInt(localStorage.getItem("bestScoreCat")) || 0;
let armorType = localStorage.getItem("armorCat") || "normal";
let legendCount = parseInt(localStorage.getItem("legendCount")) || 0;

let score = 0, lives = 3.0, isGameOver = false, gameSpeed = 5, obstacles = [], spawnTimer = 0;
let scoreMultiplier = 1, coinMultiplier = 1, isScoreStopped = false, activeTimeouts = [];

const save = () => {
    localStorage.setItem("coinsCat", coins);
    localStorage.setItem("bestScoreCat", bestScore);
    localStorage.setItem("armorCat", armorType);
    localStorage.setItem("legendCount", legendCount);
};

const updateUI = () => {
    document.getElementById("heart-display").innerText = "❤️".repeat(Math.ceil(lives));
    document.getElementById("coin-display").innerText = "🪙 " + coins;
    document.getElementById("score-display").innerText = "Score: " + score;
    document.getElementById("best-display").innerText = "Best: " + bestScore;
    document.getElementById("armor-status").innerText = "🛡️ " + armorType + (armorType === "legend" ? `(${legendCount})` : "");
    save();
};

function clearEffects() {
    activeTimeouts.forEach(clearTimeout);
    activeTimeouts = [];
    scoreMultiplier = 1; coinMultiplier = 1; isScoreStopped = false; gameSpeed = 5;
}

function applyGamble() {
    const isGood = Math.random() < 0.5;
    if (isGood) {
        scoreMultiplier = 2; alert("🔵 대박! 점수 2배 (15초)");
        activeTimeouts.push(setTimeout(() => scoreMultiplier = 1, 15000));
    } else {
        gameSpeed += 3; alert("🔴 꽝! 속도 증가 (10초)");
        activeTimeouts.push(setTimeout(() => gameSpeed -= 3, 10000));
    }
}

window.buyItem = function(type, price) {
    if (coins >= price) {
        coins -= price;
        if (type === 'gamble') applyGamble();
        else if (type === 'life') lives++;
        else { armorType = type; if (type === 'legend') legendCount = 8; }
        updateUI();
    } else alert("코인이 부족합니다!");
};

let player = { x: 50, y: 0, width: 50, height: 50, dy: 0, gravity: 0.8, jumpPower: 16, isJumping: false };

function jump() {
    if (!player.isJumping && !isGameOver) {
        player.dy = -player.jumpPower;
        player.isJumping = true;
    } else if (isGameOver) resetGame();
}

// 터치 및 클릭 이벤트
window.addEventListener("touchstart", (e) => { if (e.target.tagName !== "BUTTON") jump(); });
window.addEventListener("mousedown", (e) => { if (e.target.tagName !== "BUTTON") jump(); });
window.addEventListener("keydown", (e) => { if (e.code === "Space") jump(); });

function animate() {
    if (isGameOver) return;
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const groundY = canvas.height - 20;
    ctx.fillStyle = "#d4ac0d"; ctx.fillRect(0, groundY, canvas.width, 20);

    player.dy += player.gravity;
    player.y += player.dy;
    if (player.y >= groundY - player.height) { player.y = groundY - player.height; player.dy = 0; player.isJumping = false; }

    ctx.font = "40px serif";
    ctx.fillText("🐱", player.x, player.y + 40);

    if (++spawnTimer > 100 / (gameSpeed / 5)) {
        obstacles.push({ x: canvas.width, y: groundY - 40 });
        spawnTimer = 0;
    }

    obstacles.forEach((obs, i) => {
        obs.x -= gameSpeed;
        ctx.fillText("🌵", obs.x, obs.y + 35);

        if (player.x < obs.x + 30 && player.x + 30 > obs.x && player.y > obs.y - 30) {
            obstacles.splice(i, 1);
            if (armorType === "legend" && legendCount > 0) legendCount--;
            else lives -= (armorType === "rare" ? 0.5 : armorType === "epic" ? 0.33 : 1.0);
            updateUI();
            if (lives <= 0) { isGameOver = true; clearEffects(); alert("게임 오버!"); }
        }
        if (obs.x < -50) {
            obstacles.splice(i, 1);
            if (!isScoreStopped) score += scoreMultiplier;
            coins += coinMultiplier;
            updateUI();
        }
    });
}

function resetGame() {
    clearEffects(); score = 0; lives = 3; obstacles = []; isGameOver = false; updateUI(); animate();
}

document.getElementById("shop-btn").onclick = () => document.getElementById("shop-modal").classList.remove("hidden");
document.getElementById("close-shop").onclick = () => document.getElementById("shop-modal").classList.add("hidden");

updateUI();
animate();
