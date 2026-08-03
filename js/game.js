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

  drawBackground();

  drawDungeonWalls();

  drawDungeonDecorations();

  drawGround();

  if (assetsLoaded) {
    /*
      繪製全部敵人：
      - 陰影
      - 角色
      - 血條
    */
    drawEnemies();

    drawPlayerShadow();

    drawPlayer();
  }

  /*
    傷害數字繪製在角色上方。
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
    更新玩家。
  */
  updatePlayer(
    deltaTime
  );

  /*
    更新全部敵人。

    不再使用舊版：
    updateOrc(deltaTime)
  */
  updateEnemies(
    deltaTime
  );

  /*
    處理玩家與全部敵人的戰鬥。
  */
  resolveCombat();

  /*
    更新傷害數字：
    - 上升
    - Fade In
    - Fade Out
  */
  updateDamageNumbers(
    deltaTime
  );

  /*
    遊戲開始後更新相機。
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
    限制單幀最大時間，
    避免切換分頁或手機卡頓後，
    玩家及敵人一次移動過遠。
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
    依照 config.js 內的
    ENEMY_SPAWN_CONFIGS 建立敵人。

    目前包括：
    - ORC1
    - ORC2
  */
  initializeEnemies();
}

/* ==================================================
   初始化遊戲
================================================== */

function initializeGame() {
  /*
    只在遊戲啟動時建立一次敵人。
  */
  initializeGameEnemies();

  /*
    主循環只能啟動一次。
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
    手機直向時先顯示旋轉提示。

    轉為橫向後，
    input.js 會透過 resize 或
    orientationchange 呼叫
    handleOrientationState()。
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
