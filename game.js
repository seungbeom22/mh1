const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 화면 크기 설정 (800x400 비율 유지)
canvas.width = 800;
canvas.height = 400;

// 캐릭터 속성
let player = {
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    jumpPower: 15,
    gravity: 0.8,
    dy: 0,
    isJumping: false
};

// 장애물 속성 및 관리
let obstacles = [];
let baseSpeed = 5; // 초기 속도
let gameSpeed = baseSpeed;

let score = 0;
let isGameOver = false;

// 입력 처리 함수 (공통)
function handleJump() {
    if (!player.isJumping && !isGameOver) {
        player.dy = -player.jumpPower;
        player.isJumping = true;
    }
    if (isGameOver) {
        resetGame();
    }
}

// 키보드(컴퓨터)
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") handleJump();
});

// 터치(모바일)
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleJump();
}, { passive: false });

function resetGame() {
    isGameOver = false;
    score = 0;
    gameSpeed = baseSpeed;
    obstacles = [];
    player.y = 300;
    player.dy = 0;
    player.isJumping = false;
    animate();
}

// 무작위 장애물 생성 함수
function spawnObstacle() {
    let type = Math.random(); // 0~1 사이 난수
    let newObstacle = {
        x: canvas.width,
        y: 310,
        width: 30,
        height: 30,
        color: "red"
    };

    // 무작위로 크기 변경
    if (type > 0.7) {
        newObstacle.width = 40;
        newObstacle.height = 50;
        newObstacle.y = 290;
        newObstacle.color = "darkred";
    }

    obstacles.push(newObstacle);
}

let spawnTimer = 0;

function animate() {
    if (isGameOver) return;

    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 바닥선
    ctx.beginPath();
    ctx.moveTo(0, 340);
    ctx.lineTo(canvas.width, 340);
    ctx.stroke();

    // 2. 캐릭터 중력 및 물리
    player.dy += player.gravity;
    player.y += player.dy;

    if (player.y >= 300) {
        player.y = 300;
        player.dy = 0;
        player.isJumping = false;
    }

    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // 3. 장애물 생성 및 관리
    spawnTimer++;
    // 속도가 빠를수록 장애물이 더 자주 나옴
    let spawnInterval = Math.max(50, 100 - (gameSpeed * 2)); 
    if (spawnTimer > spawnInterval) {
        spawnObstacle();
        spawnTimer = 0;
    }

    obstacles.forEach((obs, index) => {
        obs.x -= gameSpeed; // 현재 게임 속도 적용

        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // 충돌 감지
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            isGameOver = true;
            ctx.fillStyle = "black";
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.fillText("게임 오버! 다시 하려면 클릭/스페이스", canvas.width / 2, 200);
        }

        // 장애물 통과 시 제거 및 점수 획득
        if (obs.x + obs.width < 0) {
            obstacles.splice(index, 1);
            score++;
            // 4. 속도 점진적 증가 (10점마다 속도 0.5씩 증가)
            gameSpeed = baseSpeed + (score * 0.1);
        }
    });

    // 5. 점수 표시
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score + " | Speed: " + gameSpeed.toFixed(1), 20, 30);
}

animate();
