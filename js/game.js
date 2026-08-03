"use strict";

/* 主遊戲循環、畫面繪製與初始化 */

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
      ORC 尚未完全消失時，
      繪製陰影、角色與頭頂血條。
    */
    if (orc.opacity > 0) {
      drawEntityShadow(
        orc.x,
        62,
        13
      );

      drawOrc();
      drawOrcHealthBar();
    }

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

    drawPlayer();
  }

  /*
    HUD 必須在角色與場景之後繪製，
    才會固定顯示在畫面最上層。
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
  updatePlayer(
    deltaTime
  );

  updateOrc(
    deltaTime
  );

  /*
    玩家與 ORC 完成位置及動畫更新後，
    再進行攻擊與身體碰撞判定。
  */
  resolveCombat();

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
    角色一次移動過遠。
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
   初始化
================================================== */

function initializeGame() {
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
    手機直向開啟時，
    先顯示旋轉提示。

    手機轉成橫向後，
    resize 或 orientationchange
    會呼叫 handleOrientationState，
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
