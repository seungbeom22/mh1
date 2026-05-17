const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800; canvas.height = 400;

// [보완] 코인 저장 로직을 더 확실하게 관리
let bestScore = parseInt(localStorage.getItem("bestScoreCat")) || 0;
let coins = parseInt(localStorage.getItem("coinsCat")) || 0;
let armorType = localStorage.getItem("armorCat") || "normal";
let legendCount = parseInt(localStorage.getItem("legendCount")) || 0;

let score = 0;
let lives = 3.0;
let isGameOver = false;
let gameSpeed = 5;
let obstacles = [];
let spawnTimer = 0;

// 효과 지속 관리용 변수
let isInvincible = false;
let scoreMultiplier = 1;
let coinMultiplier = 1;
let isScoreStopped = false;
let activeTimeouts = []; // 현재 실행 중인 모든 효과 시간 관리

const saveAllData = () => {
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
    saveAllData(); // UI 업데이트할 때마다 저장
};

// [추가] 모든 버프/디버프 강제 종료 함수
function clearAllEffects() {
    activeTimeouts.forEach(t => clearTimeout(t));
    activeTimeouts = [];
    isInvincible = false;
    scoreMultiplier = 1;
    coinMultiplier = 1;
    isScoreStopped = false;
    gameSpeed = 5; // 속도 초기화
}

// 도박 포션 (확률 반반)
function applyGamble() {
    const isGood = Math.random() < 0.5; // 50% 확률
    if (isGood) {
        const effects = [
            { msg: "🔵 버프: 기록 2배!", action: () => { scoreMultiplier = 2; return setTimeout(() => scoreMultiplier = 1, 15000); } },
            { msg: "🔵 버프: 속도 감소!", action: () => { gameSpeed = 3; return setTimeout(() => gameSpeed = 5, 20000); } },
            { msg: "🔵 버프: 코인 2배!", action: () => { coinMultiplier = 2; return setTimeout(() => coinMultiplier = 1, 15000); } }
        ];
        const rand = effects[Math.floor(Math.random() * effects.length)];
        activeTimeouts.push(rand.action());
        showMsg(rand.msg);
    } else {
        const effects = [
            { msg: "🔴 디버프: 속도 증가!", action: () => { gameSpeed += 3; return setTimeout(() => gameSpeed -= 3, 20000); } },
            { msg: "🔴 디버프: 코인 중단!", action: () => { coinMultiplier = 0; return setTimeout(() => coinMultiplier = 1, 10000); } },
            { msg: "🔴 디버프: 기록 중단!", action: () => { isScoreStopped = true; return setTimeout(() => isScoreStopped = false, 5000); } }
        ];
        const rand = effects[Math.floor(Math.random() * effects.length)];
        activeTimeouts.push(rand.action());
        showMsg(rand.msg);
    }
}

// 플레이어 초기 상태 (초반 점프 안 되는 문제 해결을 위해 y값 조정)
let player = { x: 50, y: 290, width: 50, height: 50, dy: 0, gravity: 0.8, jumpPower: 16, isJumping: false };

function handleJump() {
    // [수정] 게임 시작 전이나 초기 상태에서도 점프가 즉시 먹히도록 조건 완화
    if (!player.isJumping && !isGameOver) {
        player.dy = -player.jumpPower;
        player.isJumping = true;
    } else if (isGameOver) {
        resetGame();
    }
}

// 터치 이벤트 (화면 하단 빈 공간 터치 포함 전체)
window.addEventListener("touchstart", (e) => {
    if (e.target.tagName !== "BUTTON") {
        e.preventDefault();
        handleJump();
    }
}, { passive: false });

function animate() {
    if (isGameOver) return;
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#d4ac0d"; // 바닥
    ctx.fillRect(0, 340, canvas.width, 60);

    player.dy += player.gravity;
    player.y += player.dy;
    
    // 바닥 충돌 판정 보정
    if (player.y >= 290) { 
        player.y = 290; 
        player.dy = 0; 
        player.isJumping = false; 
    }

    ctx.font = "50px serif";
    ctx.fillText(isInvincible ? "✨🐱" : "🐱", player.x, player.y + 45);

    spawnTimer++;
    if (spawnTimer > 100 / (gameSpeed/5)) {
        obstacles.push({ x: canvas.width, y: 300, width: 40, height: 40 });
        spawnTimer = 0;
    }

    obstacles.forEach((obs, i) => {
        obs.x -= gameSpeed;
        ctx.fillText("🌵", obs.x, obs.y + 40);

        if (!isInvincible && player.x < obs.x + 30 && player.x + 30 > obs.x && player.y < obs.y + 40 && player.y + 40 > obs.y) {
            obstacles.splice(i, 1);
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
                clearAllEffects(); // [추가] 목숨 사라지면 모든 효과 즉시 종료
                if (score > bestScore) { bestScore = score; }
                saveAllData();
                alert("게임 오버!");
            }
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            if (!isScoreStopped) score += scoreMultiplier;
            coins += (1 * coinMultiplier);
            gameSpeed += 0.05;
            updateUI();
        }
    });
}

function resetGame() {
    clearAllEffects(); // 새 게임 시작 시 효과 초기화
    score = 0; lives = 3; gameSpeed = 5; obstacles = []; isGameOver = false;
    updateUI();
    animate();
}

updateUI();
animate();
