const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800; canvas.height = 400;

// [저장 로직] 접속 시 데이터 불러오기
let coins = parseInt(localStorage.getItem("coinsCat")) || 0;
let bestScore = parseInt(localStorage.getItem("bestScoreCat")) || 0;
let armorType = localStorage.getItem("armorCat") || "normal";
let legendCount = parseInt(localStorage.getItem("legendCount")) || 0;

let score = 0;
let lives = 3.0;
let isGameOver = false;
let gameSpeed = 5;
let obstacles = [];
let spawnTimer = 0;

// 상태 관리
let scoreMultiplier = 1;
let coinMultiplier = 1;
let isScoreStopped = false;
let activeTimeouts = [];

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
    save(); // 모든 UI 업데이트 시점에 저장
};

// 모든 효과 초기화 (죽었을 때 실행)
function resetEffects() {
    activeTimeouts.forEach(t => clearTimeout(t));
    activeTimeouts = [];
    scoreMultiplier = 1; coinMultiplier = 1; isScoreStopped = false;
    gameSpeed = 5;
}

// 도박 포션 (정확히 50% 확률)
function applyGamble() {
    const isGood = Math.random() < 0.5;
    let msg = "";
    if (isGood) {
        const r = Math.random();
        if (r < 0.33) { scoreMultiplier = 2; msg = "🔵 기록 2배!"; activeTimeouts.push(setTimeout(()=>scoreMultiplier=1, 15000)); }
        else if (r < 0.66) { gameSpeed = 3; msg = "🔵 속도 감소!"; activeTimeouts.push(setTimeout(()=>gameSpeed=5, 20000)); }
        else { coinMultiplier = 2; msg = "🔵 코인 2배!"; activeTimeouts.push(setTimeout(()=>coinMultiplier=1, 15000)); }
    } else {
        const r = Math.random();
        if (r < 0.33) { gameSpeed += 3; msg = "🔴 속도 증가!"; activeTimeouts.push(setTimeout(()=>gameSpeed-=3, 20000)); }
        else if (r < 0.66) { coinMultiplier = 0; msg = "🔴 코인 중단!"; activeTimeouts.push(setTimeout(()=>coinMultiplier=1, 10000)); }
        else { isScoreStopped = true; msg = "🔴 기록 중단!"; activeTimeouts.push(setTimeout(()=>isScoreStopped=false, 5000)); }
    }
    alert(msg);
}

window.buyItem = function(type, price) {
    if (coins >= price) {
        coins -= price;
        if (type === 'gamble') applyGamble();
        else if (type === 'life') lives++;
        else if (type === 'rare' || type === 'epic' || type === 'legend') {
            armorType = type;
            if (type === 'legend') legendCount = 8;
        }
        updateUI();
        alert("구매 완료! " + price + "코인 소실");
    } else { alert("코인이 부족합니다!"); }
};

// 플레이어 물리 엔진
let player = { x: 50, y: 290, width: 50, height: 50, dy: 0, gravity: 0.8, jumpPower: 16, isJumping: false };

function jump() {
    if (!player.isJumping && !isGameOver) {
        player.dy = -player.jumpPower;
        player.isJumping = true;
    } else if (isGameOver) resetGame();
}

// 입력 처리 (전체 영역 터치 가능)
window.addEventListener("touchstart", (e) => {
    if (e.target.tagName !== "BUTTON") { e.preventDefault(); jump(); }
}, { passive: false });
window.addEventListener("keydown", (e) => { if (e.code === "Space") jump(); });

function animate() {
    if (isGameOver) return;
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#d4ac0d"; // 바닥
    ctx.fillRect(0, 340, canvas.width, 60);

    player.dy += player.gravity;
    player.y += player.dy;
    if (player.y >= 290) { player.y = 290; player.dy = 0; player.isJumping = false; }

    ctx.font = "50px serif";
    ctx.fillText("🐱", player.x, player.y + 45);

    spawnTimer++;
    if (spawnTimer > 100 / (gameSpeed/5)) {
        obstacles.push({ x: canvas.width, y: 300 });
        spawnTimer = 0;
    }

    obstacles.forEach((obs, i) => {
        obs.x -= gameSpeed;
        ctx.fillText("🌵", obs.x, 340);

        // 충돌
        if (player.x < obs.x + 30 && player.x + 30 > obs.x && player.y < 300 + 40 && player.y + 40 > 300) {
            obstacles.splice(i, 1);
            if (armorType === "legend" && legendCount > 0) { legendCount--; }
            else {
                let d = (armorType === "rare") ? 0.5 : (armorType === "epic") ? 0.33 : 1.0;
                lives -= d;
            }
            updateUI();
            if (lives <= 0) {
                isGameOver = true;
                resetEffects();
                if (score > bestScore) bestScore = score;
                save();
                alert("게임 오버!");
            }
        }
        if (obs.x < -50) {
            obstacles.splice(i, 1);
            if (!isScoreStopped) score += scoreMultiplier;
            coins += (1 * coinMultiplier);
            gameSpeed += 0.05;
            updateUI();
        }
    });
}

function resetGame() {
    resetEffects();
    score = 0; lives = 3.0; obstacles = []; isGameOver = false;
    updateUI(); animate();
}

document.getElementById("shop-btn").onclick = () => document.getElementById("shop-modal").classList.remove("hidden");
updateUI(); animate();
