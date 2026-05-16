const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 캐릭터 속성
let player = {
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    jumpPower: 15,
    gravity: 0.6,
    dy: 0,
    isJumping: false
};

// 장애물 속성
let obstacle = {
    x: canvas.width,
    y: 310,
    width: 30,
    height: 30,
    speed: 5
};

let score = 0;
let isGameOver = false;

// 키보드 입력 처리 (스페이스바)
document.addEventListener("keydown", function(e) {
    if (e.code === "Space" && !player.isJumping && !isGameOver) {
        player.dy = -player.jumpPower;
        player.isJumping = true;
    }
    // 게임 오버 상태에서 스페이스바 누르면 재시작
    if (e.code === "Space" && isGameOver) {
        resetGame();
    }
});

function resetGame() {
    isGameOver = false;
    score = 0;
    obstacle.x = canvas.width;
    player.y = 300;
    player.dy = 0;
    player.isJumping = false;
    animate();
}

// 메인 게임 루프 (매 프레임마다 실행됨)
function animate() {
    if (isGameOver) return;

    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 화면 지우기

    // 1. 바닥선 그리기
    ctx.beginPath();
    ctx.moveTo(0, 340);
    ctx.lineTo(canvas.width, 340);
    ctx.stroke();

    // 2. 캐릭터 중력 적용 및 그리기
    player.dy += player.gravity;
    player.y += player.dy;

    // 바닥에 닿았을 때 처리
    if (player.y >= 300) {
        player.y = 300;
        player.dy = 0;
        player.isJumping = false;
    }

    ctx.fillStyle = "blue"; // 캐릭터는 파란색 네모
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // 3. 장애물 이동 및 그리기
    obstacle.x -= obstacle.speed;
    if (obstacle.x + obstacle.width < 0) {
        obstacle.x = canvas.width; // 왼쪽 끝으로 가면 다시 오른쪽에서 등장
        score++; // 장애물 피하면 점수 획득
    }

    ctx.fillStyle = "red"; // 장애물은 빨간색 네모
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    // 4. 충돌 감지 (캐릭터와 장애물이 겹쳤는지 확인)
    if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
    ) {
        isGameOver = true;
        ctx.fillStyle = "black";
        ctx.font = "30px Arial";
        ctx.fillText("게임 오버! 다시 하려면 스페이스바", 200, 200);
    }

    // 5. 점수 표시
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);
}

// 게임 시작
animate();