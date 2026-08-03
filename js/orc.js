"use strict";

/* ORC 動畫、AI、繪製與頭頂血條 */

/* ==================================================
   ORC 動畫
================================================== */

function setOrcAnimation(
  animationName,
  restart = false
) {
  if (
    !enemyAnimations[
      animationName
    ]
  ) {
    return;
  }

  if (
    orc.animation !==
      animationName ||
    restart
  ) {
    orc.animation =
      animationName;

    orc.frameIndex = 0;
    orc.frameTimer = 0;

    if (
      animationName ===
      "attack"
    ) {
      orc.attackHitRegistered =
        false;
    }
  }
}

function updateOrcAnimation(
  deltaTime
) {
  const animation =
    enemyAnimations[
      orc.animation
    ];

  if (
    !animation ||
    animation.frames.length === 0
  ) {
    return;
  }

  orc.frameTimer +=
    deltaTime;

  while (
    orc.frameTimer >=
    animation.frameDuration
  ) {
    orc.frameTimer -=
      animation.frameDuration;

    orc.frameIndex += 1;

    if (
      orc.frameIndex >=
      animation.frames.length
    ) {
      if (animation.loop) {
        orc.frameIndex = 0;
      } else {
        orc.frameIndex =
          animation.frames.length -
          1;

        if (
          orc.animation ===
          "attack"
        ) {
          orc.attacking = false;

          orc.attackCooldown =
            ORC_ATTACK_COOLDOWN;

          setOrcAnimation(
            "idle",
            true
          );
        }
      }
    }
  }
}

/* ==================================================
   ORC AI
================================================== */

function startOrcAttack() {
  if (
    orc.dead ||
    orc.attacking ||
    orc.attackCooldown > 0
  ) {
    return;
  }

  orc.attacking = true;
  orc.state = "attack";
  orc.velocityX = 0;

  orc.facing =
    player.x >= orc.x
      ? 1
      : -1;

  setOrcAnimation(
    "attack",
    true
  );
}

function updateOrc(
  deltaTime
) {
  if (!gameStarted) {
    if (assetsLoaded) {
      updateOrcAnimation(
        deltaTime
      );
    }

    return;
  }

  if (orc.dead) {
    orc.fadeTimer +=
      deltaTime;

    orc.opacity = clamp(
      1 -
        orc.fadeTimer /
          ORC_FADE_DURATION,
      0,
      1
    );

    return;
  }

  /*
    Stage Intro 期間敵人保持 Idle，
    不提前靠近或攻擊玩家。
  */
  if (
    !playerControlEnabled ||
    gameFailed
  ) {
    orc.velocityX = 0;
    orc.attacking = false;
    orc.state = "patrol";

    setOrcAnimation(
      "idle"
    );

    updateOrcAnimation(
      deltaTime
    );

    return;
  }

  if (
    orc.attackCooldown > 0
  ) {
    orc.attackCooldown =
      Math.max(
        0,
        orc.attackCooldown -
          deltaTime
      );
  }

  if (orc.attacking) {
    orc.velocityX = 0;

    updateOrcAnimation(
      deltaTime
    );

    return;
  }

  const differenceX =
    player.x - orc.x;

  const distanceX =
    Math.abs(
      differenceX
    );

  if (
    distanceX <=
    ORC_ATTACK_RANGE
  ) {
    orc.state = "attack";
    orc.velocityX = 0;

    orc.facing =
      differenceX >= 0
        ? 1
        : -1;

    if (
      orc.attackCooldown <= 0
    ) {
      startOrcAttack();
    } else {
      setOrcAnimation(
        "idle"
      );
    }
  } else if (
    distanceX <=
    ORC_DETECTION_RANGE
  ) {
    orc.state = "chase";

    const direction =
      differenceX >= 0
        ? 1
        : -1;

    orc.facing =
      direction;

    orc.velocityX =
      direction *
      ORC_CHASE_SPEED;

    setOrcAnimation(
      "walk"
    );
  } else {
    orc.state = "patrol";

    if (
      orc.patrolWaitTimer > 0
    ) {
      orc.patrolWaitTimer =
        Math.max(
          0,
          orc.patrolWaitTimer -
            deltaTime
        );

      orc.velocityX = 0;

      setOrcAnimation(
        "idle"
      );
    } else {
      orc.velocityX =
        orc.patrolDirection *
        ORC_PATROL_SPEED;

      orc.facing =
        orc.patrolDirection;

      setOrcAnimation(
        "walk"
      );
    }
  }

  orc.x +=
    orc.velocityX *
    deltaTime;

  if (
    orc.state ===
    "patrol"
  ) {
    if (
      orc.x <=
      orc.patrolMinX
    ) {
      orc.x =
        orc.patrolMinX;

      orc.patrolDirection = 1;

      orc.patrolWaitTimer =
        ORC_PATROL_WAIT_TIME;

      orc.velocityX = 0;

      setOrcAnimation(
        "idle",
        true
      );
    } else if (
      orc.x >=
      orc.patrolMaxX
    ) {
      orc.x =
        orc.patrolMaxX;

      orc.patrolDirection = -1;

      orc.patrolWaitTimer =
        ORC_PATROL_WAIT_TIME;

      orc.velocityX = 0;

      setOrcAnimation(
        "idle",
        true
      );
    }
  }

  orc.x = clamp(
    orc.x,
    80,
    WORLD_WIDTH - 80
  );

  updateOrcAnimation(
    deltaTime
  );
}

/* ==================================================
   ORC 腳底 Anchor
================================================== */

function getCurrentOrcFootOffset() {
  const animation =
    enemyAnimations[
      orc.animation
    ];

  if (
    !animation ||
    animation.footOffsets.length ===
      0
  ) {
    return 0;
  }

  const safeFrameIndex =
    Math.min(
      orc.frameIndex,
      animation.footOffsets
        .length -
        1
    );

  return (
    animation.footOffsets[
      safeFrameIndex
    ] ?? 0
  );
}

/* ==================================================
   ORC 繪製
================================================== */

function drawOrc() {
  const animation =
    enemyAnimations[
      orc.animation
    ];

  if (
    !animation ||
    animation.frames.length === 0
  ) {
    return;
  }

  const safeFrameIndex =
    Math.min(
      orc.frameIndex,
      animation.frames.length -
        1
    );

  const frame =
    animation.frames[
      safeFrameIndex
    ];

  if (!frame) {
    return;
  }

  const screenX =
    worldToScreenX(
      orc.x
    );

  if (
    screenX <
      -ORC_DRAW_MARGIN ||
    screenX >
      VIEW_WIDTH +
        ORC_DRAW_MARGIN
  ) {
    return;
  }

  const sourceFootOffset =
    getCurrentOrcFootOffset();

  const footOffsetY =
    (
      sourceFootOffset +
      ORC_EXTRA_FOOT_OFFSET
    ) *
    ENEMY_SCALE;

  const screenY =
    worldToScreenY(
      orc.y
    ) +
    footOffsetY;

  const drawWidth =
    frame.width *
    ENEMY_SCALE;

  const drawHeight =
    frame.height *
    ENEMY_SCALE;

  context.save();

  context.globalAlpha =
    orc.opacity;

  context.translate(
    Math.round(
      screenX
    ),
    Math.round(
      screenY
    )
  );

  /*
    ORC 原始素材方向與玩家相反，
    因此使用 -orc.facing。
  */
  context.scale(
    -orc.facing,
    1
  );

  context.drawImage(
    frame,
    Math.round(
      -drawWidth / 2
    ),
    Math.round(
      -drawHeight
    ),
    Math.round(
      drawWidth
    ),
    Math.round(
      drawHeight
    )
  );

  context.restore();
}

/* ==================================================
   ORC 頭頂血條
================================================== */

function drawOrcHealthBar() {
  if (
    orc.opacity <= 0 ||
    orc.dead
  ) {
    return;
  }

  const width = 96;
  const height = 9;

  const sourceFootOffset =
    getCurrentOrcFootOffset();

  const footOffsetY =
    (
      sourceFootOffset +
      ORC_EXTRA_FOOT_OFFSET
    ) *
    ENEMY_SCALE;

  const x =
    worldToScreenX(orc.x) -
    width / 2;

  /*
    血條位於 ORC 頭部上方約 4px。
  */
  const y =
    worldToScreenY(orc.y) +
    footOffsetY -
    64 * ENEMY_SCALE -
    4;

  const ratio =
    orc.maxHp > 0
      ? orc.hp /
        orc.maxHp
      : 0;

  context.save();

  context.globalAlpha =
    orc.opacity;

  context.fillStyle =
    "rgba(0,0,0,0.75)";

  context.fillRect(
    x - 1,
    y - 1,
    width + 2,
    height + 2
  );

  context.fillStyle =
    "#3c2024";

  context.fillRect(
    x,
    y,
    width,
    height
  );

  context.fillStyle =
    "#b84a54";

  context.fillRect(
    x,
    y,
    width * ratio,
    height
  );

  context.restore();
}
