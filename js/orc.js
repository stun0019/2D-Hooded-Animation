"use strict";

/*
  Hooded Escape

  ORC1／ORC2 建立、巡邏、追蹤、攻擊、
  多敵人更新、死亡淡出與重生。
*/

/* ==================================================
   取得敵人動畫資料
================================================== */

function getEnemyAnimationSet(
  enemy
) {
  return (
    enemyAnimations[
      enemy.type
    ] || null
  );
}

function getEnemyAnimation(
  enemy,
  animationName =
    enemy.animation
) {
  const animationSet =
    getEnemyAnimationSet(
      enemy
    );

  if (!animationSet) {
    return null;
  }

  return (
    animationSet[
      animationName
    ] || null
  );
}

/* ==================================================
   建立敵人
================================================== */

function createEnemy(
  spawnConfig
) {
  const typeConfig =
    ENEMY_TYPE_CONFIGS[
      spawnConfig.type
    ];

  if (!typeConfig) {
    throw new Error(
      `找不到敵人類型設定：${spawnConfig.type}`
    );
  }

  const initialDirection =
    spawnConfig
      .patrolDirection <
    0
      ? -1
      : 1;

  return {
    id:
      spawnConfig.id,

    type:
      spawnConfig.type,

    displayName:
      typeConfig.displayName,

    spawnX:
      spawnConfig.spawnX,

    x:
      spawnConfig.spawnX,

    y:
      WORLD_GROUND_Y,

    velocityX: 0,

    facing:
      initialDirection,

    scale:
      typeConfig.scale,

    spriteFacingMultiplier:
      typeConfig
        .spriteFacingMultiplier,

    level:
      typeConfig.level,

    maxHp:
      typeConfig.maxHp,

    hp:
      typeConfig.maxHp,

    attackDamage:
      typeConfig.attackDamage,

    patrolSpeed:
      typeConfig.patrolSpeed,

    chaseSpeed:
      typeConfig.chaseSpeed,

    detectionRange:
      typeConfig
        .detectionRange,

    attackRange:
      typeConfig.attackRange,

    attackCooldownDuration:
      typeConfig
        .attackCooldownDuration,

    patrolWaitDuration:
      typeConfig
        .patrolWaitDuration,

    fadeDuration:
      typeConfig.fadeDuration,

    respawnTime:
      typeConfig.respawnTime,

    extraFootOffset:
      typeConfig
        .extraFootOffset,

    patrolMinX:
      spawnConfig.patrolMinX,

    patrolMaxX:
      spawnConfig.patrolMaxX,

    initialPatrolDirection:
      initialDirection,

    patrolDirection:
      initialDirection,

    patrolWaitTimer: 0,

    state: "patrol",

    attacking: false,

    attackCooldown: 0,

    animation: "idle",

    frameIndex: 0,
    frameTimer: 0,

    attackHitRegistered:
      false,

    dead: false,

    opacity: 1,

    fadeTimer: 0,

    respawnTimer: 0
  };
}

/* ==================================================
   初始化全部敵人
================================================== */

function initializeEnemies() {
  enemies.length = 0;

  for (
    const spawnConfig of
    ENEMY_SPAWN_CONFIGS
  ) {
    enemies.push(
      createEnemy(
        spawnConfig
      )
    );
  }
}

/* ==================================================
   敵人動畫切換
================================================== */

function setEnemyAnimation(
  enemy,
  animationName,
  restart = false
) {
  const animation =
    getEnemyAnimation(
      enemy,
      animationName
    );

  if (!animation) {
    return;
  }

  if (
    enemy.animation !==
      animationName ||
    restart
  ) {
    enemy.animation =
      animationName;

    enemy.frameIndex = 0;
    enemy.frameTimer = 0;

    if (
      animationName ===
      "attack"
    ) {
      enemy.attackHitRegistered =
        false;
    }
  }
}

/* ==================================================
   敵人攻擊完成
================================================== */

function completeEnemyAttack(
  enemy
) {
  enemy.attacking = false;

  enemy.attackCooldown =
    enemy
      .attackCooldownDuration;

  enemy.velocityX = 0;

  enemy.state = "patrol";

  setEnemyAnimation(
    enemy,
    "idle",
    true
  );
}

/* ==================================================
   敵人動畫更新
================================================== */

function updateEnemyAnimation(
  enemy,
  deltaTime
) {
  const animation =
    getEnemyAnimation(
      enemy
    );

  if (
    !animation ||
    animation.frames.length ===
      0
  ) {
    return;
  }

  enemy.frameTimer +=
    deltaTime;

  while (
    enemy.frameTimer >=
    animation.frameDuration
  ) {
    enemy.frameTimer -=
      animation.frameDuration;

    enemy.frameIndex += 1;

    if (
      enemy.frameIndex >=
      animation.frames.length
    ) {
      if (animation.loop) {
        enemy.frameIndex = 0;
      } else {
        enemy.frameIndex =
          animation.frames.length -
          1;

        if (
          enemy.animation ===
          "attack"
        ) {
          completeEnemyAttack(
            enemy
          );

          return;
        }

        return;
      }
    }
  }
}

/* ==================================================
   開始敵人攻擊
================================================== */

function startEnemyAttack(
  enemy
) {
  if (
    enemy.dead ||
    enemy.attacking ||
    enemy.attackCooldown > 0 ||
    gameFailed
  ) {
    return;
  }

  enemy.attacking = true;

  enemy.state = "attack";

  enemy.velocityX = 0;

  enemy.facing =
    player.x >= enemy.x
      ? 1
      : -1;

  setEnemyAnimation(
    enemy,
    "attack",
    true
  );
}

/* ==================================================
   敵人死亡
================================================== */

function startEnemyDeath(
  enemy
) {
  if (enemy.dead) {
    return;
  }

  enemy.dead = true;

  enemy.state = "dead";

  enemy.attacking = false;

  enemy.velocityX = 0;

  enemy.attackCooldown = 0;

  enemy.attackHitRegistered =
    false;

  enemy.opacity = 1;

  enemy.fadeTimer = 0;

  enemy.respawnTimer =
    enemy.respawnTime;
}

/* ==================================================
   敵人重生
================================================== */

function respawnEnemy(
  enemy
) {
  enemy.x =
    enemy.spawnX;

  enemy.y =
    WORLD_GROUND_Y;

  enemy.velocityX = 0;

  enemy.facing =
    enemy
      .initialPatrolDirection;

  enemy.hp =
    enemy.maxHp;

  enemy.state = "patrol";

  enemy.attacking = false;

  enemy.attackCooldown = 0;

  enemy.patrolDirection =
    enemy
      .initialPatrolDirection;

  enemy.patrolWaitTimer = 0;

  enemy.attackHitRegistered =
    false;

  enemy.dead = false;

  enemy.opacity = 1;

  enemy.fadeTimer = 0;

  enemy.respawnTimer = 0;

  setEnemyAnimation(
    enemy,
    "idle",
    true
  );
}

/* ==================================================
   重設全部敵人
================================================== */

function resetAllEnemies() {
  for (
    const enemy of enemies
  ) {
    respawnEnemy(
      enemy
    );
  }
}

/* ==================================================
   死亡淡出與重生倒數
================================================== */

function updateDeadEnemy(
  enemy,
  deltaTime
) {
  enemy.velocityX = 0;

  enemy.attacking = false;

  if (
    enemy.opacity > 0
  ) {
    enemy.fadeTimer +=
      deltaTime;

    enemy.opacity = clamp(
      1 -
        enemy.fadeTimer /
          enemy.fadeDuration,
      0,
      1
    );

    return;
  }

  enemy.respawnTimer =
    Math.max(
      0,
      enemy.respawnTimer -
        deltaTime
    );

  if (
    enemy.respawnTimer <= 0
  ) {
    respawnEnemy(
      enemy
    );
  }
}

/* ==================================================
   敵人巡邏
================================================== */

function updateEnemyPatrol(
  enemy,
  deltaTime
) {
  enemy.state = "patrol";

  if (
    enemy.patrolWaitTimer >
    0
  ) {
    enemy.patrolWaitTimer =
      Math.max(
        0,
        enemy.patrolWaitTimer -
          deltaTime
      );

    enemy.velocityX = 0;

    setEnemyAnimation(
      enemy,
      "idle"
    );

    return;
  }

  enemy.velocityX =
    enemy.patrolDirection *
    enemy.patrolSpeed;

  enemy.facing =
    enemy.patrolDirection;

  setEnemyAnimation(
    enemy,
    "walk"
  );
}

/* ==================================================
   敵人追蹤
================================================== */

function updateEnemyChase(
  enemy,
  differenceX
) {
  enemy.state = "chase";

  const direction =
    differenceX >= 0
      ? 1
      : -1;

  enemy.facing =
    direction;

  enemy.velocityX =
    direction *
    enemy.chaseSpeed;

  setEnemyAnimation(
    enemy,
    "walk"
  );
}

/* ==================================================
   敵人近距離行為
================================================== */

function updateEnemyAttackRange(
  enemy,
  differenceX
) {
  enemy.state = "attack";

  enemy.velocityX = 0;

  enemy.facing =
    differenceX >= 0
      ? 1
      : -1;

  if (
    enemy.attackCooldown <=
    0
  ) {
    startEnemyAttack(
      enemy
    );
  } else {
    setEnemyAnimation(
      enemy,
      "idle"
    );
  }
}

/* ==================================================
   敵人巡邏邊界
================================================== */

function resolveEnemyPatrolBoundary(
  enemy
) {
  if (
    enemy.state !==
    "patrol"
  ) {
    return;
  }

  if (
    enemy.x <=
    enemy.patrolMinX
  ) {
    enemy.x =
      enemy.patrolMinX;

    enemy.patrolDirection =
      1;

    enemy.facing = 1;

    enemy.patrolWaitTimer =
      enemy
        .patrolWaitDuration;

    enemy.velocityX = 0;

    setEnemyAnimation(
      enemy,
      "idle",
      true
    );

    return;
  }

  if (
    enemy.x >=
    enemy.patrolMaxX
  ) {
    enemy.x =
      enemy.patrolMaxX;

    enemy.patrolDirection =
      -1;

    enemy.facing = -1;

    enemy.patrolWaitTimer =
      enemy
        .patrolWaitDuration;

    enemy.velocityX = 0;

    setEnemyAnimation(
      enemy,
      "idle",
      true
    );
  }
}

/* ==================================================
   單隻敵人更新
================================================== */

function updateEnemy(
  enemy,
  deltaTime
) {
  if (!gameStarted) {
    if (assetsLoaded) {
      updateEnemyAnimation(
        enemy,
        deltaTime
      );
    }

    return;
  }

  /*
    死亡狀態優先處理淡出與重生。
  */
  if (enemy.dead) {
    updateDeadEnemy(
      enemy,
      deltaTime
    );

    return;
  }

  /*
    STAGE Intro 或 FAIL 期間，
    存活敵人停止行動。
  */
  if (
    !playerControlEnabled ||
    gameFailed
  ) {
    enemy.velocityX = 0;

    enemy.attacking = false;

    enemy.state = "patrol";

    setEnemyAnimation(
      enemy,
      "idle"
    );

    updateEnemyAnimation(
      enemy,
      deltaTime
    );

    return;
  }

  if (
    enemy.attackCooldown >
    0
  ) {
    enemy.attackCooldown =
      Math.max(
        0,
        enemy.attackCooldown -
          deltaTime
      );
  }

  /*
    攻擊動畫播放期間，
    不進行其他 AI 行為。
  */
  if (enemy.attacking) {
    enemy.velocityX = 0;

    updateEnemyAnimation(
      enemy,
      deltaTime
    );

    return;
  }

  const differenceX =
    player.x - enemy.x;

  const distanceX =
    Math.abs(
      differenceX
    );

  if (
    distanceX <=
    enemy.attackRange
  ) {
    updateEnemyAttackRange(
      enemy,
      differenceX
    );
  } else if (
    distanceX <=
    enemy.detectionRange
  ) {
    updateEnemyChase(
      enemy,
      differenceX
    );
  } else {
    updateEnemyPatrol(
      enemy,
      deltaTime
    );
  }

  enemy.x +=
    enemy.velocityX *
    deltaTime;

  resolveEnemyPatrolBoundary(
    enemy
  );

  enemy.x = clamp(
    enemy.x,
    80,
    WORLD_WIDTH - 80
  );

  enemy.y =
    WORLD_GROUND_Y;

  updateEnemyAnimation(
    enemy,
    deltaTime
  );
}

/* ==================================================
   更新全部敵人
================================================== */

function updateEnemies(
  deltaTime
) {
  for (
    const enemy of enemies
  ) {
    updateEnemy(
      enemy,
      deltaTime
    );
  }
}

/* ==================================================
   取得目前敵人影格
================================================== */

function getCurrentEnemyFrame(
  enemy
) {
  const animation =
    getEnemyAnimation(
      enemy
    );

  if (
    !animation ||
    animation.frames.length ===
      0
  ) {
    return null;
  }

  const safeFrameIndex =
    Math.min(
      enemy.frameIndex,
      animation.frames.length -
        1
    );

  return (
    animation.frames[
      safeFrameIndex
    ] || null
  );
}

/* ==================================================
   取得敵人腳底 Offset
================================================== */

function getCurrentEnemyFootOffset(
  enemy
) {
  const animation =
    getEnemyAnimation(
      enemy
    );

  if (
    !animation ||
    animation.footOffsets
      .length === 0
  ) {
    return 0;
  }

  const safeFrameIndex =
    Math.min(
      enemy.frameIndex,
      animation
        .footOffsets
        .length -
        1
    );

  return (
    animation.footOffsets[
      safeFrameIndex
    ] || 0
  );
}

/* ==================================================
   繪製單隻敵人
================================================== */

function drawEnemy(
  enemy
) {
  if (
    enemy.opacity <= 0
  ) {
    return;
  }

  const frame =
    getCurrentEnemyFrame(
      enemy
    );

  if (!frame) {
    return;
  }

  const screenX =
    worldToScreenX(
      enemy.x
    );

  if (
    screenX <
      -ENEMY_DRAW_MARGIN ||
    screenX >
      VIEW_WIDTH +
        ENEMY_DRAW_MARGIN
  ) {
    return;
  }

  const sourceFootOffset =
    getCurrentEnemyFootOffset(
      enemy
    );

  const footOffsetY =
    (
      sourceFootOffset +
      enemy.extraFootOffset
    ) *
    enemy.scale;

  const screenY =
    worldToScreenY(
      enemy.y
    ) +
    footOffsetY;

  const drawWidth =
    frame.width *
    enemy.scale;

  const drawHeight =
    frame.height *
    enemy.scale;

  context.save();

  context.globalAlpha =
    enemy.opacity;

  context.translate(
    Math.round(
      screenX
    ),
    Math.round(
      screenY
    )
  );

  context.scale(
    enemy.facing *
      enemy
        .spriteFacingMultiplier,
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
   敵人頭頂血條
================================================== */

function drawEnemyHealthBar(
  enemy
) {
  if (
    enemy.dead ||
    enemy.opacity <= 0
  ) {
    return;
  }

  const frame =
    getCurrentEnemyFrame(
      enemy
    );

  if (!frame) {
    return;
  }

  const width = 96;
  const height = 9;

  const sourceFootOffset =
    getCurrentEnemyFootOffset(
      enemy
    );

  const footOffsetY =
    (
      sourceFootOffset +
      enemy.extraFootOffset
    ) *
    enemy.scale;

  const drawHeight =
    frame.height *
    enemy.scale;

  const x =
    worldToScreenX(
      enemy.x
    ) -
    width / 2;

  const y =
    worldToScreenY(
      enemy.y
    ) +
    footOffsetY -
    drawHeight -
    4;

  const healthRatio =
    enemy.maxHp > 0
      ? clamp(
          enemy.hp /
            enemy.maxHp,
          0,
          1
        )
      : 0;

  context.save();

  context.globalAlpha =
    enemy.opacity;

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
    width *
      healthRatio,
    height
  );

  context.restore();
}

/* ==================================================
   繪製全部敵人
================================================== */

function drawEnemies() {
  /*
    先繪製全部敵人的地面陰影。
  */
  for (
    const enemy of enemies
  ) {
    if (
      enemy.opacity <= 0
    ) {
      continue;
    }

    drawEntityShadow(
      enemy.x,
      62,
      13
    );
  }

  /*
    再繪製敵人與頭頂血條。
  */
  for (
    const enemy of enemies
  ) {
    if (
      enemy.opacity <= 0
    ) {
      continue;
    }

    drawEnemy(
      enemy
    );

    drawEnemyHealthBar(
      enemy
    );
  }
}
