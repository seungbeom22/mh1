const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800; canvas.height = 400;

// 데이터 로드
let bestScore = localStorage.getItem("bestScoreCat") || 0;
let coins = parseInt(localStorage.getItem("coinsCat")) || 0;
let score = 0;
let lives = 3;
let isGameOver = false;
let gameSpeed = 5;

// 아이템 상태
let isInvincible = false;
let spawnTimer = 0;
let obstacles = [];

// 플레이어
let player = { x: 50, y: 290, width: 50, height: 50, dy: 0, gravity: 0.8, jumpPower: 15, isJumping: false };

// 효과음 함수
const playNote = (f, d, t = 'sine') => {
    const a = new (window.AudioContext || window.webkitAudioContext)();
    const o = a.createOscillator(); const g = a.createGain();
    o.type = t; o.frequency.value = f; o.connect(g); g.connect(a.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.00001, a.currentTime + d);
    o.stop(a.currentTime + d);
};

// UI 업데이트 함수
function updateUI() {
    document.getElementById("heart-display").innerText = "❤️".repeat(Math.max(0, lives));
    document.getElementById("coin-display").innerText = "🪙 " + coins;
    document.getElementById("score-display").innerText = "Score: " + score;
    document.getElementById("best-display").innerText = "Best: " + bestScore;
    localStorage.setItem("coinsCat", coins);
}

// 상점 아이템 구매 (즉시 적용)
window.buyItem = function(item, price) {
    if (coins >= price) {
        coins -= price;
        playNote(880, 0.2, 'square');
        
        if (item === 'shield') {
            isInvincible = true;
            setTimeout(() => { isInvincible = false; }, 3000);
        } else if (item === 'life') {
            lives++;
        } else if (item === 'slow') {
            const originalSpeed = gameSpeed;
            gameSpeed = 3; 
            setTimeout(() => { gameSpeed = originalSpeed; }, 10000);
        }
        updateUI();
        alert("아이템이 즉시 적용되었습니다!");
    } else {
        alert("코인이 부족합니다!");
    }
};

// 점프 로직
function handleJump() {
    if (!player.isJumping && !isGameOver) {
        player.dy = -player.jumpPower;
        player.isJumping = true;
        playNote(400, 0.1, 'triangle');
    } else if (isGameOver) {
        resetGame();
    }
}

// 이벤트 리스너
document.addEventListener("keydown", (e) => e.code === "Space" && handleJump());
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); handleJump(); }, { passive: false });
document.getElementById("shop-btn").onclick = () => document.getElementById("shop-modal").classList.remove("hidden");
document.getElementById("close-shop").onclick = () => document.getElementById("shop-modal").classList.add("hidden");

function resetGame() {
    score = 0; lives = 3; gameSpeed = 5; obstacles = []; isGameOver = false; isInvincible = false;
    updateUI(); animate();
}

function animate() {
    if (isGameOver) return;
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 바닥
    ctx.fillStyle = "#d4ac0d";
    ctx.fillRect(0, 340, canvas.width, 60);

    // 중력
    player.dy += player.gravity;
    player.y += player.dy;
    if (player.y >= 290) { player.y = 290; player.dy = 0; player.isJumping = false; }

    // 캐릭터 그리기
    ctx.font = "50px serif";
    ctx.fillText(isInvincible ? "✨🐱" : "🐱", player.x, player.y + 45);

    // 장애물 생성 (랜덤 간격)
    spawnTimer++;
    if (spawnTimer > (Math.random() * 60 + 70) / (gameSpeed/5)) {
        obstacles.push({ x: canvas.width, y: 300, width: 40, height: 40 });
        spawnTimer = 0;
    }

    obstacles.forEach((obs, i) => {
        obs.x -= gameSpeed;
        ctx.fillText("🌵", obs.x, obs.y + 40);

        // 충돌 감지
        if (!isInvincible && 
            player.x < obs.x + 30 && player.x + 30 > obs.x &&
            player.y < obs.y + 40 && player.y + 40 > obs.y) {
            
            lives--;
            obstacles.splice(i, 1);
            playNote(150, 0.3, 'sawtooth');
            updateUI();
            if (lives <= 0) {
                isGameOver = true;
                if (score > bestScore) {
                    bestScore = score;
                    localStorage.setItem("bestScoreCat", bestScore);
                }
                updateUI();
                setTimeout(() => alert("게임 오버!"), 10);
            }
        }

        // 점수 및 코인 획득
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            score++;
            coins++;
            gameSpeed += 0.05;
            updateUI();
        }
    });
}

// 초기 실행
updateUI();
animate();
