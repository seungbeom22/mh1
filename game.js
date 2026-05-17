const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

// 데이터 영구 저장 (localStorage)
let bestScore = parseInt(localStorage.getItem("bestScoreCat")) || 0;
let coins = parseInt(localStorage.getItem("coinsCat")) || 0;
let armorType = localStorage.getItem("armorCat") || "normal"; // 영구 방어구
let legendCount = parseInt(localStorage.getItem("legendCount")) || 0;

let score = 0;
let lives = 3.0; // 방어구를 위해 실수형으로 관리
let isGameOver = false;
let gameSpeed = 5;
let obstacles = [];
let spawnTimer = 0;

// 버프/디버프 상태
let scoreMultiplier = 1;
let coinMultiplier = 1;
let isScoreStopped = false;

let player = { x: 50, y: canvas.height - 100, width: 60, height: 60, dy: 0, gravity: 0.8, jumpPower: 18, isJumping: false };

const updateUI = () => {
    document.getElementById("heart-display").innerText = "❤️".repeat(Math.ceil(lives));
    document.getElementById("coin-display").innerText = "🪙 " + coins;
    document.getElementById("score-display").innerText = "Score: " + score;
    document.getElementById("best-display").innerText = "Best: " + bestScore;
    
    let armorName = { "normal": "🛡️ 기본", "rare": "💎 레어", "epic": "🔮 에픽", "legend": `👑 전설(${legendCount})` };
    document.getElementById("armor-status").innerText = armorName[armorType];

    localStorage.setItem("coinsCat", coins);
    localStorage.setItem("armorCat", armorType);
    localStorage.setItem("legendCount", legendCount);
};

const showMsg = (txt) => {
    const box = document.getElementById("msg-box");
    box.innerText = txt;
    setTimeout(() => { box.innerText = ""; }, 2000);
};

// 도박 포션 로직
function applyGamble() {
    const effects = [
        { msg: "🔴 디버프: 속도 증가!", action: () => { gameSpeed += 3; setTimeout(() => gameSpeed -= 3, 20000); } },
        { msg: "🔴 디버프: 코인 획득 불가!", action: () => { coinMultiplier = 0; setTimeout(() => coinMultiplier = 1, 10000); } },
        { msg: "🔴 디버프: 기록 중단!", action: () => { isScoreStopped = true; setTimeout(() => isScoreStopped = false, 5000); } },
        { msg: "🔵 버프: 기록 2배!", action: () => { scoreMultiplier = 2; setTimeout(() => scoreMultiplier = 1, 15000); } },
        { msg: "🔵 버프: 속도 감소!", action: () => { gameSpeed = 3; setTimeout(() => gameSpeed = 5, 20000); } },
        { msg: "🔵 버프: 코인 2배!", action: () => { coinMultiplier = 2; setTimeout(() => coinMultiplier = 1, 15000); } }
    ];
    const rand = effects[Math.floor(Math.random() * effects.length)];
    rand.action();
    showMsg(rand.msg);
}

window.buyItem = function(item, price) {
    if (coins >= price) {
        coins -= price;
        if (item === 'shield') { /* 3초 무적 로직 */ }
        else if (item === 'life') lives++;
        else if (item === 'gamble') applyGamble();
        else if (item === 'rare' || item === 'epic' || item === 'legend') {
            armorType = item;
            if (item === 'legend') legendCount = 8;
            showMsg(`${item} 방어구 구매 완료!`);
        }
        updateUI();
        showMsg(`${price}코인 소실! 구매 완료`);
    } else { alert("코인이 부족합니다!"); }
};

function handleJump() {
    if (!player.isJumping && !isGameOver) {
        player.dy = -player.jumpPower;
        player.isJumping = true;
    } else if (isGameOver) resetGame();
}

// 모바일: 화면 어디를 눌러도 점프 (상점 버튼 제외)
window.addEventListener("touchstart", (e) => {
    if (e.target.tagName !== "BUTTON") { e.preventDefault(); handleJump(); }
}, { passive: false });
window.addEventListener("keydown", (e) => e.code === "Space" && handleJump());

function animate() {
    if (isGameOver) return;
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 바닥
    ctx.fillStyle = "#d4ac0d";
    const groundY = canvas.height - 50;
    ctx.fillRect(0, groundY, canvas.width, 50);

    // 중력 및 이동
    player.dy += player.gravity;
    player.y += player.dy;
    if (player.y >= groundY - player.height) { player.y = groundY - player.height; player.dy = 0; player.isJumping = false; }

    ctx.font = "50px serif";
    ctx.fillText("🐱", player.x, player.y + 45);

    spawnTimer++;
    if (spawnTimer > 100 / (gameSpeed/5)) {
        obstacles.push({ x: canvas.width, y: groundY - 40, width: 40, height: 40 });
        spawnTimer = 0;
    }

    obstacles.forEach((obs, i) => {
        obs.x -= gameSpeed;
        ctx.fillText("🌵", obs.x, obs.y + 35);

        if (player.x < obs.x + 30 && player.x + 30 > obs.x && player.y < obs.y + 35 && player.y + 35 > obs.y) {
            obstacles.splice(i, 1);
            // 방어구 데미지 계산
            if (armorType === "legend" && legendCount > 0) { legendCount--; }
            else {
                let damage = 1.0;
                if (armorType === "rare") damage = 0.5;
                if (armorType === "epic") damage = 0.33;
                lives -= damage;
            }
            updateUI();
            if (lives <= 0) {
                isGameOver = true;
                if (score > bestScore) { bestScore = score; localStorage.setItem("bestScoreCat", bestScore); }
                alert("게임 오버!");
            }
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            if (!isScoreStopped) score += scoreMultiplier;
            coins += (1 * coinMultiplier);
            gameSpeed += 0.03;
            updateUI();
        }
    });
}

function resetGame() {
    score = 0; lives = 3; gameSpeed = 5; obstacles = []; isGameOver = false;
    updateUI(); animate();
}

document.getElementById("shop-btn").onclick = () => document.getElementById("shop-modal").classList.remove("hidden");
document.getElementById("close-shop").onclick = () => document.getElementById("shop-modal").classList.add("hidden");

updateUI();
animate();
