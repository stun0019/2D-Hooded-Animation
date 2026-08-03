"use strict";

/* 玩家動畫、控制與繪製 */

/* ==================================================
   玩家動畫
================================================== */

function setPlayerAnimation(
  animationName,
  restart = false
) {
  if (
    !playerAnimations[
      animationName
    ]
  ) {
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

    if (
      animationName ===
      "attack"
    ) {
      player.attackHitRegistered =
        false;
    }
  }
}

function completePlayerAttack() {
  player.attacking = false;
  player.airAttacking = false;

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

  if (
    player.animation ===
    "jump"
  ) {
    const lastFrame =
      animation.frames.length - 1;

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
        }
      }
    }
  }
}

/* ==================================================
   玩家控制
================================================== */

function triggerJump() {
  if (
    !gameStarted ||
    !playerControlEnabled ||
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

function triggerPlayerAttack() {
  if (
    !gameStarted ||
    !playerControlEnabled ||
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
    Stage Intro、FAIL 期間：
    玩家固定保持 Idle，不能移動或攻擊。
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

  if (pressed.jump) {
    triggerJump();

    pressed.jump = false;
  }

  if (pressed.attack) {
    triggerPlayerAttack();

    pressed.attack = false;
  }

  let horizontalDirection =
    Number(input.right) -
    Number(input.left);

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
    !player.attacking;

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

  if (player.y < 100) {
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

  const frame =
    animation.frames[
      Math.min(
        player.frameIndex,
        animation.frames.length -
          1
      )
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
      player.invincibleTimer * 20
    ) % 2 === 0
  ) {
    context.globalAlpha = 0.4;
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
