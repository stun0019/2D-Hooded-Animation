"use strict";

/* Hurtbox、Hitbox、傷害、無敵與碰撞擊退 */

/* ==================================================
   V0.6 戰鬥判定
================================================== */

function getPlayerHurtbox() {
  const width = 42;

  const height =
    player.ducking
      ? 48
      : 72;

  return {
    x:
      player.x -
      width / 2,

    y:
      player.y -
      height,

    width,
    height
  };
}

function getPlayerAttackHitbox() {
  if (
    !player.attacking ||
    player.animation !==
      "attack" ||
    player.frameIndex <
      PLAYER_ATTACK_ACTIVE_START ||
    player.frameIndex >
      PLAYER_ATTACK_ACTIVE_END
  ) {
    return null;
  }

  const width = 70;
  const height = 58;
  const offset = 38;

  return {
    x:
      player.facing === 1
        ? player.x +
          offset
        : player.x -
          offset -
          width,

    y:
      player.y -
      height -
      8,

    width,
    height
  };
}

function getOrcHurtbox() {
  const width = 72;
  const height = 105;

  return {
    x:
      orc.x -
      width / 2,

    y:
      orc.y -
      height,

    width,
    height
  };
}

function getOrcAttackHitbox() {
  if (
    orc.dead ||
    !orc.attacking ||
    orc.animation !==
      "attack" ||
    orc.frameIndex <
      ORC_ATTACK_ACTIVE_START ||
    orc.frameIndex >
      ORC_ATTACK_ACTIVE_END
  ) {
    return null;
  }

  const width = 86;
  const height = 75;
  const offset = 42;

  return {
    x:
      orc.facing === 1
        ? orc.x +
          offset
        : orc.x -
          offset -
          width,

    y:
      orc.y -
      height -
      4,

    width,
    height
  };
}

/* ==================================================
   傷害
================================================== */

function damagePlayer(amount) {
  if (
    gameFailed ||
    player.invincibleTimer > 0 ||
    player.hp <= 0
  ) {
    return;
  }

  player.hp = Math.max(
    0,
    player.hp - amount
  );

  player.invincibleTimer =
    PLAYER_INVINCIBLE_TIME;

  if (player.hp <= 0) {
    triggerFail();
  }
}

function damageOrc(amount) {
  if (
    orc.dead ||
    orc.hp <= 0
  ) {
    return;
  }

  orc.hp = Math.max(
    0,
    orc.hp - amount
  );

  if (orc.hp <= 0) {
    orc.dead = true;
    orc.attacking = false;
    orc.velocityX = 0;
    orc.state = "dead";
    orc.fadeTimer = 0;
  }
}

/* ==================================================
   身體接觸
================================================== */

function applyBodyContact() {
  if (
    orc.dead ||
    gameFailed
  ) {
    return;
  }

  const playerHurtbox =
    getPlayerHurtbox();

  const orcHurtbox =
    getOrcHurtbox();

  if (
    !rectanglesIntersect(
      playerHurtbox,
      orcHurtbox
    )
  ) {
    return;
  }

  const playerDirection =
    player.x < orc.x
      ? -1
      : 1;

  /*
    玩家碰到 ORC 時，
    不論等級都會被推開。
  */
  player.x = clamp(
    player.x +
      playerDirection *
      BODY_KNOCKBACK_DISTANCE,
    52,
    WORLD_WIDTH - 52
  );

  /*
    玩家等級高於 ORC 時，
    ORC 也會被反方向推開。
  */
  if (
    player.level >
    orc.level
  ) {
    orc.x = clamp(
      orc.x -
        playerDirection *
        BODY_KNOCKBACK_DISTANCE,
      80,
      WORLD_WIDTH - 80
    );
  }

  damagePlayer(
    BODY_CONTACT_DAMAGE
  );
}

/* ==================================================
   戰鬥總判定
================================================== */

function resolveCombat() {
  if (
    !gameStarted ||
    !playerControlEnabled ||
    gameFailed ||
    orc.dead
  ) {
    return;
  }

  const playerAttackHitbox =
    getPlayerAttackHitbox();

  if (
    playerAttackHitbox &&
    !player.attackHitRegistered &&
    rectanglesIntersect(
      playerAttackHitbox,
      getOrcHurtbox()
    )
  ) {
    player.attackHitRegistered =
      true;

    damageOrc(
      PLAYER_ATTACK_DAMAGE
    );
  }

  const orcAttackHitbox =
    getOrcAttackHitbox();

  if (
    orcAttackHitbox &&
    !orc.attackHitRegistered &&
    rectanglesIntersect(
      orcAttackHitbox,
      getPlayerHurtbox()
    )
  ) {
    orc.attackHitRegistered =
      true;

    damagePlayer(
      ORC_ATTACK_DAMAGE
    );
  }

  applyBodyContact();
}
