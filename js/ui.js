"use strict";

/* Loading、手機方向提示、Stage Intro、HUD、FAIL 與重生 */

/* ==================================================
   Loading
================================================== */

function setLoadingProgress(
  progress,
  message
) {
  const safeProgress =
    clamp(
      progress,
      0,
      100
    );

  progressBar.style.width =
    `${safeProgress}%`;

  progressNumber.textContent =
    `${Math.floor(
      safeProgress
    )}%`;

  if (message) {
    loadingMessage.textContent =
      message;
  }
}

function animateProgress(
  start,
  end,
  duration,
  message
) {
  return new Promise(
    (resolve) => {
      const startTime =
        performance.now();

      function update(
        currentTime
      ) {
        const elapsed =
          currentTime -
          startTime;

        const ratio =
          Math.min(
            elapsed /
              duration,
            1
          );

        const easedRatio =
          1 -
          Math.pow(
            1 - ratio,
            2
          );

        const progress =
          start +
          (
            end - start
          ) *
          easedRatio;

        setLoadingProgress(
          progress,
          message
        );

        if (ratio < 1) {
          requestAnimationFrame(
            update
          );
        } else {
          resolve();
        }
      }

      requestAnimationFrame(
        update
      );
    }
  );
}

async function runFakeLoading() {
  setLoadingProgress(
    0,
    "正在確認地下城入口……"
  );

  await animateProgress(
    0,
    30,
    850,
    "正在確認地下城入口……"
  );

  await wait(150);

  await animateProgress(
    30,
    62,
    950,
    "正在喚醒兜帽旅人……"
  );

  await wait(150);

  await animateProgress(
    62,
    82,
    850,
    "正在分析地下城生物……"
  );

  await wait(150);

  await animateProgress(
    82,
    90,
    700,
    "正在校正獸人腳底座標……"
  );

  setLoadingProgress(
    90,
    "正在解除地下城最後封印……"
  );

  await wait(1000);

  await animateProgress(
    90,
    100,
    850,
    "正在建立冒險視野……"
  );

  setLoadingProgress(
    100,
    "地下城入口已開啟"
  );

  fakeLoadingCompleted =
    true;
}

function revealEnterButton() {
  if (
    !assetsLoaded ||
    !fakeLoadingCompleted
  ) {
    return;
  }

  window.setTimeout(
    () => {
      loadingStatus.classList.add(
        "hidden"
      );

      window.setTimeout(
        () => {
          enterDungeonButton.classList.add(
            "visible"
          );
        },
        300
      );
    },
    450
  );
}

async function startLoadingSequence() {
  if (
    loadingSequenceStarted
  ) {
    return;
  }

  loadingSequenceStarted =
    true;

  loadingPage.classList.add(
    "prepared"
  );

  await waitForNextPaint();

  loadingPage.classList.add(
    "visible"
  );

  try {
    await Promise.all([
      loadAllAnimations().then(
        () => {
          assetsLoaded =
            true;
        }
      ),

      runFakeLoading()
    ]);

    revealEnterButton();
  } catch (error) {
    console.error(error);

    loadingMessage.textContent =
      "素材載入失敗，請檢查圖片路徑與大小寫";

    progressNumber.textContent =
      "錯誤";

    progressBar.style.width =
      "100%";

    progressBar.style.background =
      "#944b4b";
  }
}

/* ==================================================
   手機方向提示
================================================== */

function showOrientationScreen() {
  orientationScreen.classList.remove(
    "fade-out"
  );

  orientationScreen.classList.add(
    "visible"
  );
}

async function leaveOrientationScreen() {
  if (
    orientationTransitioning ||
    !orientationScreen.classList.contains(
      "visible"
    )
  ) {
    return;
  }

  orientationTransitioning =
    true;

  loadingPage.classList.add(
    "prepared"
  );

  await waitForNextPaint();

  loadingPage.classList.add(
    "visible"
  );

  orientationScreen.classList.add(
    "fade-out"
  );

  startLoadingSequence();

  await wait(
    ORIENTATION_FADE_TIME
  );

  orientationScreen.classList.remove(
    "visible",
    "fade-out"
  );

  orientationTransitioning =
    false;
}

function handleOrientationState() {
  if (
    gameStarted ||
    !isTouchDevice()
  ) {
    return;
  }

  if (isPortrait()) {
    showOrientationScreen();
    return;
  }

  if (
    orientationScreen.classList.contains(
      "visible"
    )
  ) {
    leaveOrientationScreen();
  } else {
    startLoadingSequence();
  }
}

/* ==================================================
   Stage Intro
================================================== */

async function playStageIntro() {
  if (
    stageIntroPlaying
  ) {
    return;
  }

  stageIntroPlaying =
    true;

  playerControlEnabled =
    false;

  document.body.classList.remove(
    "player-control-enabled"
  );

  resetAllInputs();

  stageIntroTitle.textContent =
    "STAGE 1";

  stageIntro.classList.remove(
    "fade-out"
  );

  stageIntro.classList.add(
    "visible"
  );

  await waitForNextPaint();

  await wait(
    STAGE_INTRO_HOLD_TIME
  );

  stageIntro.classList.add(
    "fade-out"
  );

  await wait(
    STAGE_INTRO_FADE_TIME
  );

  stageIntro.classList.remove(
    "visible",
    "fade-out"
  );

  resetAllInputs();

  playerControlEnabled =
    true;

  stageIntroPlaying =
    false;

  document.body.classList.add(
    "player-control-enabled"
  );

  window.setTimeout(
    () => {
      updateJoystickCenter();
    },
    100
  );

  canvas.focus();
}

/* ==================================================
   開始遊戲
================================================== */

async function startGame() {
  if (
    gameStarted ||
    !assetsLoaded ||
    !fakeLoadingCompleted
  ) {
    return;
  }

  gameStarted = true;
  gameFailed = false;

  playerControlEnabled =
    false;

  resetAllInputs();
  snapCameraToPlayer();

  document.body.classList.add(
    "game-started"
  );

  document.body.classList.remove(
    "player-control-enabled"
  );

  loadingPage.classList.add(
    "game-entered"
  );

  window.setTimeout(
    () => {
      updateJoystickCenter();
    },
    100
  );

  /*
    等待 Loading Page 完成淡出，
    再播放 STAGE 1。
  */
  await wait(
    LOADING_PAGE_FADE_TIME
  );

  await playStageIntro();
}

enterDungeonButton.addEventListener(
  "click",
  startGame
);

/* ==================================================
   玩家血量 HUD
================================================== */

function drawPlayerHud() {
  if (!gameStarted) {
    return;
  }

  const x = 22;
  const y = 22;

  const barHeight = 22;

  /*
    等級提高後，
    血條向右延伸。
  */
  const barWidth =
    170 +
    (
      player.level - 1
    ) *
    18;

  const healthRatio =
    player.maxHp > 0
      ? clamp(
          player.hp /
            player.maxHp,
          0,
          1
        )
      : 0;

  context.save();

  context.fillStyle =
    "rgba(0,0,0,0.65)";

  context.fillRect(
    x - 8,
    y - 8,
    barWidth + 16,
    54
  );

  context.fillStyle =
    "#ffffff";

  context.font =
    "bold 16px Arial, Microsoft JhengHei";

  context.fillText(
    `LV.${player.level}  HP ${player.hp} / ${player.maxHp}`,
    x,
    y + 15
  );

  context.fillStyle =
    "#2b2025";

  context.fillRect(
    x,
    y + 22,
    barWidth,
    barHeight
  );

  context.fillStyle =
    "#b84552";

  context.fillRect(
    x,
    y + 22,
    barWidth *
      healthRatio,
    barHeight
  );

  context.strokeStyle =
    "rgba(255,255,255,0.55)";

  context.strokeRect(
    x,
    y + 22,
    barWidth,
    barHeight
  );

  context.restore();
}

/* ==================================================
   Debug HUD
================================================== */

function drawDebugHud() {
  if (!gameStarted) {
    return;
  }

  const stateNames = {
    patrol: "巡邏",
    chase: "追蹤",
    attack: "攻擊",
    dead: "死亡"
  };

  /*
    Debug 放在玩家血條下方，
    避免和血量介面重疊。
  */
  const panelX = 16;
  const panelY = 84;
  const panelWidth = 350;
  const panelHeight = 246;

  context.save();

  context.fillStyle =
    "rgba(0,0,0,0.48)";

  context.fillRect(
    panelX,
    panelY,
    panelWidth,
    panelHeight
  );

  context.fillStyle =
    "#ffffff";

  context.font =
    "18px Arial, Microsoft JhengHei";

  context.fillText(
    `世界：${WORLD_WIDTH} × ${WORLD_HEIGHT}`,
    42,
    panelY + 29
  );

  context.fillText(
    `玩家：${Math.round(
      player.x
    )}, ${Math.round(
      player.y
    )}`,
    42,
    panelY + 55
  );

  context.fillText(
    `玩家動作：${player.animation}`,
    42,
    panelY + 81
  );

  context.fillText(
    `玩家 HP：${player.hp} / ${player.maxHp}`,
    42,
    panelY + 107
  );

  context.fillText(
    `玩家無敵：${player.invincibleTimer.toFixed(
      2
    )} 秒`,
    42,
    panelY + 133
  );

  context.fillText(
    `空中攻擊：${
      player.airAttacking
        ? "是"
        : "否"
    }`,
    42,
    panelY + 159
  );

  context.fillText(
    `玩家控制：${
      playerControlEnabled
        ? "開啟"
        : "鎖定"
    }`,
    42,
    panelY + 185
  );

  context.fillText(
    `相機：${Math.round(
      camera.x
    )}, ${Math.round(
      camera.y
    )}`,
    42,
    panelY + 211
  );

  context.fillText(
    `ORC1：${
      stateNames[
        orc.state
      ] || orc.state
    }｜HP ${orc.hp} / ${orc.maxHp}`,
    42,
    panelY + 237
  );

  context.restore();
}

/* ==================================================
   FAIL
================================================== */

function triggerFail() {
  if (gameFailed) {
    return;
  }

  gameFailed = true;

  playerControlEnabled =
    false;

  document.body.classList.remove(
    "player-control-enabled"
  );

  resetAllInputs();

  player.velocityX = 0;
  player.velocityY = 0;

  orc.velocityX = 0;
  orc.attacking = false;

  failScreen.classList.add(
    "visible"
  );
}

/* ==================================================
   重生
================================================== */

async function respawnPlayer() {
  failScreen.classList.remove(
    "visible"
  );

  gameFailed = false;

  playerControlEnabled =
    false;

  document.body.classList.remove(
    "player-control-enabled"
  );

  resetAllInputs();

  /*
    重設玩家。
  */
  player.x =
    player.spawnX;

  player.y =
    WORLD_GROUND_Y;

  player.velocityX = 0;
  player.velocityY = 0;

  player.facing = 1;

  player.grounded = true;
  player.ducking = false;

  player.attacking = false;
  player.airAttacking = false;

  player.hp =
    player.maxHp;

  player.invincibleTimer = 0;
  player.attackHitRegistered = false;

  setPlayerAnimation(
    "idle",
    true
  );

  /*
    重設 ORC。
  */
  orc.x =
    orc.spawnX;

  orc.y =
    WORLD_GROUND_Y;

  orc.velocityX = 0;
  orc.facing = -1;

  orc.state = "patrol";

  orc.attacking = false;
  orc.attackCooldown = 0;

  orc.patrolDirection = -1;
  orc.patrolWaitTimer = 0;

  orc.hp =
    orc.maxHp;

  orc.attackHitRegistered =
    false;

  orc.dead = false;
  orc.opacity = 1;
  orc.fadeTimer = 0;

  setOrcAnimation(
    "idle",
    true
  );

  snapCameraToPlayer();

  await playStageIntro();
}

respawnButton.addEventListener(
  "click",
  respawnPlayer
);
