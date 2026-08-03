"use strict";

/*
  Hooded Escape

  主遊戲循環、玩家更新、多敵人更新、
  戰鬥判定、傷害數字、相機與畫面繪製。
*/

/* ==================================================
   玩家陰影
================================================== */

function drawPlayerShadow() {
  /*
    玩家跳得越高，
    地面陰影越小。
  */
  const playerHeight =
    Math.max(
      0,
      WORLD_GROUND_Y -
        player.y
    );

  const shadowScale =
    clamp(
      1 -
        playerHeight /
          700,
      0.45,
      1
    );

  drawEntityShadow(
    player.x,
    50 *
      shadowScale,
    12 *
      shadowScale
  );
}

/* ==================================================
   畫面繪製
================================================== */

function render() {
  context.clearRect(
    0,
    0,
    VIEW_WIDTH,
    VIEW_HEIGHT
  );

  /*
    地牢背景。
  */
  drawBackground();

  drawDungeonWalls();

  drawDungeonDecorations();

  drawGround();

  if (assetsLoaded) {
    /*
      全部敵人的陰影、角色與血條，
      由 drawEnemies() 統一繪製。
    */
    drawEnemies();

    /*
      玩家陰影。
    */
    drawPlayerShadow();

    /*
      玩家角色。
    */
    drawPlayer();
  }

  /*
    傷害數字位於角色上方，
    但位於固定 HUD 下方。
  */
  drawDamageNumbers();

  /*
    固定畫面 HUD。
  */
  drawPlayerHud();

  drawDebugHud();
}

/* ==================================================
   遊戲更新
================================================== */

function updateGame(
  deltaTime
) {
  /*
    1. 更新玩家狀態與動畫。
  */
  updatePlayer(
    deltaTime
  );

  /*
    2. 更新全部敵人。

    每隻敵人會獨立處理：
    - 巡邏
    - 追蹤
    - 攻擊
    - 死亡淡出
    - 重生倒數
  */
  updateEnemies(
    deltaTime
  );

  /*
    3. 處理玩家與全部敵人的戰鬥。
  */
  resolveCombat();

  /*
    4. 更新傷害數字的位置、
    Fade In 與 Fade Out 時間。
  */
  updateDamageNumbers(
    deltaTime
  );

  /*
    5. 遊戲開始後更新相機。
  */
  if (gameStarted) {
    updateCamera(
      deltaTime
    );
  }
}

/* ==================================================
   遊戲循環
================================================== */

function gameLoop(
  currentTime
) {
  const rawDeltaTime =
    (
      currentTime -
      previousTime
    ) /
    1000;

  /*
    限制單幀最大時間。

    避免：
    - 切換瀏覽器分頁
    - 手機暫時卡頓
    - 視窗進入背景

    回到遊戲後角色或敵人
    一次移動過遠。
  */
  const deltaTime =
    Math.min(
      rawDeltaTime,
      1 / 30
    );

  previousTime =
    currentTime;

  updateGame(
    deltaTime
  );

  render();

  requestAnimationFrame(
    gameLoop
  );
}

/* ==================================================
   初始化敵人
================================================== */

function initializeGameEnemies() {
  /*
    根據 config.js 的
    ENEMY_SPAWN_CONFIGS 建立：

    - ORC1
    - ORC2

    敵人只在遊戲初始化時建立一次。
    死亡後由各自的重生計時器重生。
  */
  initializeEnemies();
}

/* ==================================================
   初始化遊戲
================================================== */

function initializeGame() {
  /*
    建立全部敵人。
  */
  initializeGameEnemies();

  /*
    主遊戲循環只能啟動一次。
  */
  if (!gameLoopStarted) {
    gameLoopStarted =
      true;

    previousTime =
      performance.now();

    requestAnimationFrame(
      gameLoop
    );
  }

  /*
    手機直向開啟時，
    先顯示旋轉提示。

    手機轉成橫向後，
    resize 或 orientationchange
    會呼叫 handleOrientationState()，
    再開始 Loading。
  */
  if (
    isTouchDevice() &&
    isPortrait()
  ) {
    showOrientationScreen();
  } else {
    startLoadingSequence();
  }
}

/* ==================================================
   啟動
================================================== */

initializeGame();
