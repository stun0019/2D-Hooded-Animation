"use strict";

/*
  Hooded Escape

  玩家動畫、移動、跳躍、攻擊、
  Hurt 動畫與角色繪製。
*/

/* ==================================================
   玩家動畫切換
================================================== */

function setPlayerAnimation(
  animationName,
  restart = false
) {
  const animation =
    playerAnimations[
      animationName
    ];

  if (!animation) {
    return;
  }

  if (
    player.animation !==
      animationName ||
    restart
  ) {
    player.animation =
      animationName;

    player.frameIndex = 0;
    player.frameTimer = 0;

    /*
      每次開始新的攻擊時，
      清除上一次攻擊命中的敵人紀錄。
    */
    if (
      animationName ===
      "attack"
    ) {
      player
        .attackHitEnemyIds
        .clear();
    }
  }
}

/* ==================================================
   玩家攻擊動畫完成
================================================== */

function completePlayerAttack() {
  player.attacking = false;
  player.airAttacking = false;

  if (player.hurt) {
    setPlayerAnimation(
      "hurt",
      true
    );

    return;
  }

  if (player.grounded) {
    setPlayerAnimation(
      "idle",
      true
    );
  } else {
    setPlayerAnimation(
      "jump",
      true
    );
  }
}

/* ==================================================
   玩家 Hurt 動畫
================================================== */

function triggerPlayerHurt() {
  if (
    player.hp <= 0 ||
    gameFailed
  ) {
    return;
  }

  /*
    已經處於 Hurt 狀態時，
    不重新啟動同一段動畫。
  */
  if (player.hurt) {
    return;
  }

  player.hurt = true;

  player.ducking = false;

  player.attacking = false;
  player.airAttacking = false;

  player.velocityX = 0;

  pressed.jump = false;
  pressed.attack = false;

  input.jump = false;
  input.attack = false;

  setPlayerAnimation(
    "hurt",
    true
  );
}

function completePlayerHurt() {
  player.hurt = false;

  if (
    player.hp <= 0 ||
    gameFailed
  ) {
    return;
  }

  if (player.grounded) {
    setPlayerAnimation(
      "idle",
      true
    );
  } else {
    setPlayerAnimation(
      "jump",
      true
    );
  }
}

/* ==================================================
   玩家動畫更新
================================================== */

function updatePlayerAnimation(
  deltaTime
) {
  const animation =
    playerAnimations[
      player.animation
    ];

  if (
    !animation ||
    animation.frames.length === 0
  ) {
    return;
  }

  /*
    Jump 動畫依照玩家的垂直速度，
    直接選擇對應影格。
  */
  if (
    player.animation ===
    "jump"
  ) {
    const lastFrame =
      animation.frames.length -
      1;

    if (
      player.velocityY < -520
    ) {
      player.frameIndex =
        Math.min(
          1,
          lastFrame
        );
    } else if (
      player.velocityY < -260
    ) {
      player.frameIndex =
        Math.min(
          2,
          lastFrame
        );
    } else if (
      player.velocityY < -60
    ) {
      player.frameIndex =
        Math.min(
          3,
          lastFrame
        );
    } else if (
      player.velocityY < 160
    ) {
      player.frameIndex =
        Math.min(
          4,
          lastFrame
        );
    } else if (
      player.velocityY < 380
    ) {
      player.frameIndex =
        Math.min(
          5,
          lastFrame
        );
    } else if (
      player.velocityY < 620
    ) {
      player.frameIndex =
        Math.min(
          6,
          lastFrame
        );
    } else {
      player.frameIndex =
        Math.min(
          7,
          lastFrame
        );
    }

    return;
  }

  player.frameTimer +=
    deltaTime;

  while (
    player.frameTimer >=
    animation.frameDuration
  ) {
    player.frameTimer -=
      animation.frameDuration;

    player.frameIndex += 1;

    if (
      player.frameIndex >=
      animation.frames.length
    ) {
      if (animation.loop) {
        player.frameIndex = 0;
      } else {
        player.frameIndex =
          animation.frames.length -
          1;

        if (
          player.animation ===
          "attack"
        ) {
          completePlayerAttack();
          return;
        }

        if (
          player.animation ===
          "hurt"
        ) {
          completePlayerHurt();
          return;
        }
      }
    }
  }
}

/* ==================================================
   玩家跳躍
================================================== */

function triggerJump() {
  if (
    !gameStarted ||
    !playerControlEnabled ||
    gameFailed ||
    player.hurt ||
    !player.grounded ||
    player.attacking ||
    player.ducking
  ) {
    return;
  }

  player.grounded = false;
  player.ducking = false;

  player.velocityY =
    -JUMP_FORCE;

  setPlayerAnimation(
    "jump",
    true
  );
}

/* ==================================================
   玩家攻擊
================================================== */

function triggerPlayerAttack() {
  if (
    !gameStarted ||
    !playerControlEnabled ||
    gameFailed ||
    player.hurt ||
    player.attacking ||
    player.ducking
  ) {
    return;
  }

  player.attacking = true;

  if (player.grounded) {
    player.airAttacking = false;
    player.velocityX = 0;
  } else {
    player.airAttacking = true;
  }

  setPlayerAnimation(
    "attack",
    true
  );
}

/* ==================================================
   Hurt 狀態更新
================================================== */

function updatePlayerHurtState(
  deltaTime
) {
  player.ducking = false;

  player.attacking = false;
  player.airAttacking = false;

  player.velocityX = 0;

  pressed.jump = false;
  pressed.attack = false;

  /*
    玩家在空中受傷時，
    Hurt 動畫仍會受到重力影響。
  */
  if (!player.grounded) {
    player.velocityY +=
      GRAVITY *
      deltaTime;
  }

  player.x +=
    player.velocityX *
    deltaTime;

  player.y +=
    player.velocityY *
    deltaTime;

  player.x = clamp(
    player.x,
    52,
    WORLD_WIDTH - 52
  );

  if (
    player.y >=
    WORLD_GROUND_Y
  ) {
    player.y =
      WORLD_GROUND_Y;

    player.velocityY = 0;
    player.grounded = true;
  }

  if (
    player.y < 100
  ) {
    player.y = 100;

    if (
      player.velocityY < 0
    ) {
      player.velocityY = 0;
    }
  }

  updatePlayerAnimation(
    deltaTime
  );
}

/* ==================================================
   玩家更新
================================================== */

function updatePlayer(
  deltaTime
) {
  if (!gameStarted) {
    if (assetsLoaded) {
      updatePlayerAnimation(
        deltaTime
      );
    }

    return;
  }

  /*
    STAGE 1 開場或 FAIL 期間，
    玩家保持 Idle 並停止操作。
  */
  if (
    !playerControlEnabled ||
    gameFailed
  ) {
    player.velocityX = 0;
    player.velocityY = 0;

    player.y =
      WORLD_GROUND_Y;

    player.grounded = true;
    player.ducking = false;

    player.attacking = false;
    player.airAttacking = false;
    player.hurt = false;

    pressed.jump = false;
    pressed.attack = false;

    setPlayerAnimation(
      "idle"
    );

    updatePlayerAnimation(
      deltaTime
    );

    return;
  }

  /*
    更新玩家受傷後的無敵時間。
  */
  if (
    player.invincibleTimer > 0
  ) {
    player.invincibleTimer =
      Math.max(
        0,
        player.invincibleTimer -
          deltaTime
      );
  }

  /*
    Hurt 狀態具有最高動畫優先權。
  */
  if (player.hurt) {
    updatePlayerHurtState(
      deltaTime
    );

    return;
  }

  if (pressed.jump) {
    triggerJump();

    pressed.jump = false;
  }

  if (pressed.attack) {
    triggerPlayerAttack();

    pressed.attack = false;
  }

  let horizontalDirection =
    Number(
      input.right
    ) -
    Number(
      input.left
    );

  let analogStrength =
    Math.abs(
      horizontalDirection
    );

  if (joystick.active) {
    horizontalDirection =
      joystick.x;

    analogStrength =
      joystick.magnitude;
  }

  const joystickDucking =
    joystick.active &&
    joystick.y >
      DUCK_THRESHOLD &&
    Math.abs(
      joystick.x
    ) < 0.55;

  player.ducking =
    (
      input.duck ||
      joystickDucking
    ) &&
    player.grounded &&
    !player.attacking &&
    !player.hurt;

  /*
    玩家不是攻擊或蹲下時，
    才能正常水平移動。
  */
  if (
    !player.attacking &&
    !player.ducking
  ) {
    if (
      Math.abs(
        horizontalDirection
      ) >
      JOYSTICK_DEAD_ZONE
    ) {
      const shouldRun =
        input.run ||
        analogStrength >=
          RUN_THRESHOLD;

      const movementSpeed =
        shouldRun
          ? RUN_SPEED
          : WALK_SPEED;

      player.velocityX =
        horizontalDirection *
        movementSpeed;

      player.facing =
        horizontalDirection > 0
          ? 1
          : -1;

      if (player.grounded) {
        setPlayerAnimation(
          shouldRun
            ? "run"
            : "walk"
        );
      }
    } else {
      player.velocityX = 0;

      if (player.grounded) {
        setPlayerAnimation(
          "idle"
        );
      }
    }
  } else {
    /*
      空中攻擊期間保留原本的水平速度。
    */
    if (
      !player.airAttacking
    ) {
      player.velocityX = 0;
    }

    if (player.ducking) {
      setPlayerAnimation(
        "duck"
      );
    }
  }

  /*
    空中狀態套用重力。
  */
  if (!player.grounded) {
    player.velocityY +=
      GRAVITY *
      deltaTime;

    if (
      !player.airAttacking
    ) {
      setPlayerAnimation(
        "jump"
      );
    }
  }

  player.x +=
    player.velocityX *
    deltaTime;

  player.y +=
    player.velocityY *
    deltaTime;

  player.x = clamp(
    player.x,
    52,
    WORLD_WIDTH - 52
  );

  /*
    玩家落地。
  */
  if (
    player.y >=
    WORLD_GROUND_Y
  ) {
    const wasAirborne =
      !player.grounded;

    player.y =
      WORLD_GROUND_Y;

    player.velocityY = 0;
    player.grounded = true;

    if (
      wasAirborne &&
      !player.attacking
    ) {
      player.airAttacking =
        false;

      setPlayerAnimation(
        "idle",
        true
      );
    }
  }

  /*
    世界頂部限制。
  */
  if (
    player.y < 100
  ) {
    player.y = 100;

    if (
      player.velocityY < 0
    ) {
      player.velocityY = 0;
    }
  }

  updatePlayerAnimation(
    deltaTime
  );
}

/* ==================================================
   玩家繪製
================================================== */

function drawPlayer() {
  const animation =
    playerAnimations[
      player.animation
    ];

  if (
    !animation ||
    animation.frames.length === 0
  ) {
    return;
  }

  const safeFrameIndex =
    Math.min(
      player.frameIndex,
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

  const drawWidth =
    frame.width *
    PLAYER_SCALE;

  const drawHeight =
    frame.height *
    PLAYER_SCALE;

  const screenX =
    worldToScreenX(
      player.x
    );

  const screenY =
    worldToScreenY(
      player.y
    );

  context.save();

  /*
    玩家無敵期間閃爍。
  */
  if (
    player.invincibleTimer > 0 &&
    Math.floor(
      player.invincibleTimer *
      20
    ) %
      2 ===
    0
  ) {
    context.globalAlpha =
      0.4;
  }

  context.translate(
    Math.round(
      screenX
    ),
    Math.round(
      screenY
    )
  );

  context.scale(
    player.facing,
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
