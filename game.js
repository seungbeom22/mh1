const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800; canvas.height = 400;

// 효과음 생성기 (별도 파일 없이 브라우저 기본 음으로 재밌게 구현)
const playSound = (freq, type = 'sine', duration = 0.1) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
};

// 게임 상태
let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;
let coins = parseInt(localStorage.getItem("coins")) || 0;
let lives = 3;
let isGameOver = false;
let gameSpeed = 5;
let isInvincible = false;
let isSlowed = false;

// 플레이어 (귀여운 고양이 - 그림으로 대체)
let player = { x: 50, y: 300, width: 50, height: 50, dy: 0, gravity: 0.8, jumpPower: 15, isJumping: false };

let obstacles = [];
let spawnTimer = 0;

// 상점 기능
function buyItem(item, price) {
    if (coins >= price) {
        coins -= price;
        updateUI();
        if (item === 'shield') { isInvincible = true; setTimeout(() => isInvincible = false, 3000); }
        if (item === 'life') { lives++; updateUI(); }
        if (item === 'slow') { gameSpeed /= 2; setTimeout(() => gameSpeed *= 2, 10000); }
        playSound(880, 'square');
        alert("아이템 적용 완료!");
    } else {
        alert("코인이 부족해요!");
    }
}

// UI 업데이트
function updateUI() {
    document.getElementById("heart-display").innerText = "❤️".repeat(lives);
    document.getElementById("coin-display").innerText = "🪙 " + coins;
    localStorage.setItem("coins", coins);
}

// 입력 처리
function handleJump() {
    if (!player.isJumping && !isGameOver) {
        player.dy = -player.jumpPower;
        player.isJumping = true;
        playSound(440, 'triangle'); // 점프 소리
    }
    if (isGameOver) resetGame();
}

document.addEventListener("keydown", (e) => e.code === "Space" && handleJump());
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); handleJump(); }, { passive: false });
document.getElementById("shop-btn").onclick = () => document.getElementById("shop-modal").classList.toggle("hidden");
document.getElementById("close-shop").onclick = () => document.getElementById("shop-modal").classList.add("hidden");

function spawnObstacle() {
    // 간격 다르게 하기 위해 랜덤 타이머 설정
    let width = 30 + Math.random() * 20;
    obstacles.push({ x: canvas.width, y: 340 - width, width: width, height: width });
}

function animate() {
    if (isGameOver) return;
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 (사막 지평선)
    ctx.fillStyle = "#d4ac0d";
    ctx.fillRect(0, 340, canvas.width, 60);

    // 캐릭터 (고양이)
    player.dy += player.gravity;
    player.y += player.dy;
    if (player.y >= 290) { player.y = 290; player.dy = 0; player.isJumping = false; }
    
    ctx.font = "50px serif"; // 고양이 이모지로 캐릭터 표현
    ctx.fillText(isInvincible ? "✨🐱" : "🐱", player.x, player.y + 40);

    // 장애물 (선인장) 및 관리
    spawnTimer++;
    let randomGap = 80 + Math.random() * 100; // 간격 랜덤화
    if (spawnTimer > randomGap / (gameSpeed/5)) {
        spawnObstacle();
        spawnTimer = 0;
    }

    obstacles.forEach((obs, index) => {
        obs.x -= gameSpeed;
        ctx.font = `${obs.width + 10}px serif`;
        ctx.fillText("🌵", obs.x, obs.y + obs.height);

        // 충돌
        if (!isInvincible && 
            player.x < obs.x + obs.width - 10 &&
            player.x + player.width - 10 > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y) {
            
            lives--;
            obstacles.splice(index, 1);
            playSound(150, 'sawtooth', 0.3); // 데미지 소리
            updateUI();

            if (lives <= 0) {
                isGameOver = true;
                if (score > bestScore) {
                    bestScore = score;
                    localStorage.setItem("bestScore", bestScore);
                }
                alert(`게임 오버! 점수: ${score} | 최고: ${bestScore}`);
            }
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(index, 1);
            score++;
            coins++; // 장애물 넘을 때마다 코인 1씩
            updateUI();
            gameSpeed += 0.1; // 속도 증가
        }
    });

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Best: ${bestScore} | Score: ${score}`, 20, 70);
}

function resetGame() {
    lives = 3; score = 0; gameSpeed = 5; obstacles = []; isGameOver = false;
    updateUI();
    animate();
}

updateUI();
animate();
