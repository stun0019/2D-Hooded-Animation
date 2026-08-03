"use strict";

/*
  Hooded Escape

  玩家與多隻敵人的 Hurtbox、Hitbox、
  傷害、接觸碰撞及死亡判定。
*/

/* ==================================================
   玩家 Hurtbox
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

/* ==================================================
   玩家攻擊 Hitbox
================================================== */

function getPlayerAttackHitbox() {
  if (
    !player.attacking ||
    player.hurt ||
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

/* ==================================================
   敵人 Hurtbox
================================================== */

function getEnemyHurtbox(
  enemy
) {
  const width = 72;
  const height = 105;

  return {
    x:
      enemy.x -
      width / 2,

    y:
      enemy.y -
      height,

    width,
    height
  };
}

/* ==================================================
   敵人攻擊 Hitbox
================================================== */

function getEnemyAttackHitbox(
  enemy
) {
  if (
    enemy.dead ||
    !enemy.attacking ||
    enemy.animation !==
      "attack" ||
    enemy.frameIndex <
      ENEMY_ATTACK_ACTIVE_START ||
    enemy.frameIndex >
      ENEMY_ATTACK_ACTIVE_END
  ) {
    return null;
  }

  const width = 86;
  const height = 75;
  const offset = 42;

  return {
    x:
      enemy.facing === 1
        ? enemy.x +
          offset
        : enemy.x -
          offset -
          width,

    y:
      enemy.y -
      height -
      4,

    width,
    height
  };
}

/* ==================================================
   玩家受到傷害
================================================== */

function damagePlayer(
  amount
) {
  if (
    gameFailed ||
    player.hp <= 0 ||
    player.invincibleTimer > 0
  ) {
    return false;
  }

  const actualDamage =
    Math.min(
      amount,
      player.hp
    );

  player.hp =
    Math.max(
      0,
      player.hp -
        amount
    );

  player.invincibleTimer =
    PLAYER_INVINCIBLE_TIME;

  createDamageNumber(
    actualDamage,
    player.x,
    player.y - 82,
    "player"
  );

  if (
    player.hp <= 0
  ) {
    triggerFail();

    return true;
  }

  triggerPlayerHurt();

  return true;
}

/* ==================================================
   敵人受到傷害
================================================== */

function damageEnemy(
  enemy,
  amount
) {
  if (
    enemy.dead ||
    enemy.hp <= 0
  ) {
    return false;
  }

  const actualDamage =
    Math.min(
      amount,
      enemy.hp
    );

  enemy.hp =
    Math.max(
      0,
      enemy.hp -
        amount
    );

  createDamageNumber(
    actualDamage,
    enemy.x,
    enemy.y - 118,
    "enemy"
  );

  if (
    enemy.hp <= 0
  ) {
    startEnemyDeath(
      enemy
    );
  }

  return true;
}

/* ==================================================
   玩家攻擊全部敵人
================================================== */

function resolvePlayerAttack() {
  const playerAttackHitbox =
    getPlayerAttackHitbox();

  if (!playerAttackHitbox) {
    return;
  }

  for (
    const enemy of enemies
  ) {
    if (
      enemy.dead ||
      enemy.opacity <= 0
    ) {
      continue;
    }

    /*
      同一次玩家攻擊，
      每隻敵人最多受到一次傷害。
    */
    if (
      player
        .attackHitEnemyIds
        .has(
          enemy.id
        )
    ) {
      continue;
    }

    const enemyHurtbox =
      getEnemyHurtbox(
        enemy
      );

    if (
      !rectanglesIntersect(
        playerAttackHitbox,
        enemyHurtbox
      )
    ) {
      continue;
    }

    player
      .attackHitEnemyIds
      .add(
        enemy.id
      );

    damageEnemy(
      enemy,
      PLAYER_ATTACK_DAMAGE
    );
  }
}

/* ==================================================
   敵人攻擊玩家
================================================== */

function resolveEnemyAttacks() {
  for (
    const enemy of enemies
  ) {
    if (
      enemy.dead ||
      enemy.opacity <= 0 ||
      enemy.attackHitRegistered
    ) {
      continue;
    }

    const enemyAttackHitbox =
      getEnemyAttackHitbox(
        enemy
      );

    if (!enemyAttackHitbox) {
      continue;
    }

    const playerHurtbox =
      getPlayerHurtbox();

    if (
      !rectanglesIntersect(
        enemyAttackHitbox,
        playerHurtbox
      )
    ) {
      continue;
    }

    /*
      不論玩家是否因無敵時間而免疫，
      這次敵人攻擊都只判定一次。
    */
    enemy.attackHitRegistered =
      true;

    damagePlayer(
      enemy.attackDamage
    );
  }
}

/* ==================================================
   玩家與敵人身體接觸
================================================== */

function resolveBodyContact(
  enemy
) {
  if (
    enemy.dead ||
    enemy.opacity <= 0 ||
    gameFailed
  ) {
    return;
  }

  const playerHurtbox =
    getPlayerHurtbox();

  const enemyHurtbox =
    getEnemyHurtbox(
      enemy
    );

  if (
    !rectanglesIntersect(
      playerHurtbox,
      enemyHurtbox
    )
  ) {
    return;
  }

  /*
    玩家位於敵人左側時，
    玩家向左推開。

    玩家位於敵人右側時，
    玩家向右推開。
  */
  const playerPushDirection =
    player.x < enemy.x
      ? -1
      : 1;

  player.x = clamp(
    player.x +
      playerPushDirection *
      BODY_KNOCKBACK_DISTANCE,
    52,
    WORLD_WIDTH - 52
  );

  /*
    玩家等級高於敵人時，
    敵人也會被反方向推開。
  */
  if (
    player.level >
    enemy.level
  ) {
    enemy.x = clamp(
      enemy.x -
        playerPushDirection *
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
   全部敵人身體接觸判定
================================================== */

function resolveAllBodyContacts() {
  for (
    const enemy of enemies
  ) {
    resolveBodyContact(
      enemy
    );

    if (gameFailed) {
      return;
    }
  }
}

/* ==================================================
   戰鬥總判定
================================================== */

function resolveCombat() {
  if (
    !gameStarted ||
    !playerControlEnabled ||
    gameFailed
  ) {
    return;
  }

  /*
    先處理玩家攻擊。

    若敵人在這一幀被擊殺，
    後續敵人攻擊與接觸判定
    會自動略過該敵人。
  */
  resolvePlayerAttack();

  resolveEnemyAttacks();

  if (gameFailed) {
    return;
  }

  resolveAllBodyContacts();
}
