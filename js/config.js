"use strict";

/*
  Hooded Escape

  全域 DOM、世界設定、戰鬥設定、
  玩家狀態、敵人生成設定與共用工具。
*/

/* ==================================================
   DOM
================================================== */

const canvas =
  document.getElementById(
    "game-canvas"
  );

const context =
  canvas.getContext(
    "2d"
  );

const orientationScreen =
  document.getElementById(
    "orientation-screen"
  );

const loadingPage =
  document.getElementById(
    "loading-page"
  );

const loadingStatus =
  document.getElementById(
    "loading-status"
  );

const loadingMessage =
  document.getElementById(
    "loading-message"
  );

const progressBar =
  document.getElementById(
    "progress-bar"
  );

const progressNumber =
  document.getElementById(
    "progress-number"
  );

const enterDungeonButton =
  document.getElementById(
    "enter-dungeon-button"
  );

const stageIntro =
  document.getElementById(
    "stage-intro"
  );

const stageIntroTitle =
  document.getElementById(
    "stage-intro-title"
  );

const failScreen =
  document.getElementById(
    "fail-screen"
  );

const respawnButton =
  document.getElementById(
    "respawn-button"
  );

const attackKeySelect =
  document.getElementById(
    "attack-key-select"
  );

const attackKeyLabel =
  document.getElementById(
    "attack-key-label"
  );

const joystickZone =
  document.getElementById(
    "joystick-zone"
  );

const joystickBase =
  document.getElementById(
    "joystick-base"
  );

const joystickStick =
  document.getElementById(
    "joystick-stick"
  );

context.imageSmoothingEnabled =
  false;

/* ==================================================
   畫面與世界設定
================================================== */

const VIEW_WIDTH = 1280;
const VIEW_HEIGHT = 720;

const WORLD_WIDTH = 2560;
const WORLD_HEIGHT = 1440;

const WORLD_GROUND_Y = 1240;

/* ==================================================
   玩家移動設定
================================================== */

const GRAVITY = 2200;

const WALK_SPEED = 230;
const RUN_SPEED = 420;

const JUMP_FORCE = 820;

const PLAYER_SCALE = 2.6;
const ENEMY_SCALE = 2.3;

/* ==================================================
   相機設定
================================================== */

const CAMERA_FOLLOW_SPEED =
  5.5;

/* ==================================================
   手機操作設定
================================================== */

const JOYSTICK_DEAD_ZONE =
  0.14;

const RUN_THRESHOLD =
  0.72;

const DUCK_THRESHOLD =
  0.62;

/* ==================================================
   畫面流程設定
================================================== */

const ORIENTATION_FADE_TIME =
  650;

const STAGE_INTRO_HOLD_TIME =
  500;

const STAGE_INTRO_FADE_TIME =
  500;

const LOADING_PAGE_FADE_TIME =
  850;

/* ==================================================
   玩家戰鬥設定
================================================== */

const PLAYER_LEVEL = 1;

const PLAYER_BASE_MAX_HP =
  100;

const PLAYER_HP_PER_LEVEL =
  20;

const PLAYER_ATTACK_DAMAGE =
  25;

const PLAYER_INVINCIBLE_TIME =
  0.5;

/*
  玩家攻擊動畫的有效判定影格。

  frameIndex 從 0 開始，
  因此 3～5 代表動畫第 4～6張。
*/
const PLAYER_ATTACK_ACTIVE_START =
  3;

const PLAYER_ATTACK_ACTIVE_END =
  5;

/* ==================================================
   敵人共用戰鬥設定
================================================== */

const ENEMY_DEFAULT_LEVEL = 1;

const ENEMY_BASE_MAX_HP =
  100;

const ENEMY_ATTACK_DAMAGE =
  18;

const BODY_CONTACT_DAMAGE =
  10;

const BODY_KNOCKBACK_DISTANCE =
  6;

const ENEMY_FADE_DURATION =
  0.55;

const ENEMY_RESPAWN_TIME =
  5;

/*
  敵人攻擊動畫有效影格。
*/
const ENEMY_ATTACK_ACTIVE_START =
  3;

const ENEMY_ATTACK_ACTIVE_END =
  5;

/* ==================================================
   敵人 AI 設定
================================================== */

const ENEMY_PATROL_SPEED =
  72;

const ENEMY_CHASE_SPEED =
  112;

const ENEMY_DETECTION_RANGE =
  390;

const ENEMY_ATTACK_RANGE =
  105;

const ENEMY_ATTACK_COOLDOWN =
  1.1;

const ENEMY_PATROL_WAIT_TIME =
  1;

const ENEMY_DRAW_MARGIN =
  260;

/*
  自動 Anchor 偵測完成後，
  再向下補償 4 個原始素材像素。

  4 × 2.3 = 9.2px
*/
const ORC_EXTRA_FOOT_OFFSET =
  4;

/* ==================================================
   傷害數字設定
================================================== */

const DAMAGE_NUMBER_TOTAL_TIME =
  0.9;

const DAMAGE_NUMBER_FADE_IN_TIME =
  0.12;

const DAMAGE_NUMBER_FADE_OUT_TIME =
  0.28;

const DAMAGE_NUMBER_RISE_SPEED =
  42;

/* ==================================================
   敵人類型設定
================================================== */

const ENEMY_TYPE_CONFIGS = {
  ORC1: {
    type: "ORC1",

    displayName: "ORC1",

    basePath:
      "2D_Enemy/ORC1",

    scale:
      ENEMY_SCALE,

    level:
      ENEMY_DEFAULT_LEVEL,

    maxHp:
      ENEMY_BASE_MAX_HP,

    attackDamage:
      ENEMY_ATTACK_DAMAGE,

    patrolSpeed:
      ENEMY_PATROL_SPEED,

    chaseSpeed:
      ENEMY_CHASE_SPEED,

    detectionRange:
      ENEMY_DETECTION_RANGE,

    attackRange:
      ENEMY_ATTACK_RANGE,

    attackCooldownDuration:
      ENEMY_ATTACK_COOLDOWN,

    patrolWaitDuration:
      ENEMY_PATROL_WAIT_TIME,

    fadeDuration:
      ENEMY_FADE_DURATION,

    respawnTime:
      ENEMY_RESPAWN_TIME,

    extraFootOffset:
      ORC_EXTRA_FOOT_OFFSET,

    spriteFacingMultiplier:
      -1
  },

  ORC2: {
    type: "ORC2",

    displayName: "ORC2",

    basePath:
      "2D_Enemy/ORC2",

    scale:
      ENEMY_SCALE,

    level:
      ENEMY_DEFAULT_LEVEL,

    maxHp:
      ENEMY_BASE_MAX_HP,

    attackDamage:
      ENEMY_ATTACK_DAMAGE,

    patrolSpeed:
      ENEMY_PATROL_SPEED,

    chaseSpeed:
      ENEMY_CHASE_SPEED,

    detectionRange:
      ENEMY_DETECTION_RANGE,

    attackRange:
      ENEMY_ATTACK_RANGE,

    attackCooldownDuration:
      ENEMY_ATTACK_COOLDOWN,

    patrolWaitDuration:
      ENEMY_PATROL_WAIT_TIME,

    fadeDuration:
      ENEMY_FADE_DURATION,

    respawnTime:
      ENEMY_RESPAWN_TIME,

    extraFootOffset:
      ORC_EXTRA_FOOT_OFFSET,

    spriteFacingMultiplier:
      -1
  },

  /*
    ORC3 目前只有 Idle 素材。

    之後新增 Walk、ATK 素材時，
    只需更新 assets.js 的動畫定義。
  */
  ORC3: {
    type: "ORC3",

    displayName: "ORC3",

    basePath:
      "2D_Enemy/ORC3",

    scale:
      ENEMY_SCALE,

    level:
      ENEMY_DEFAULT_LEVEL,

    maxHp:
      ENEMY_BASE_MAX_HP,

    attackDamage:
      ENEMY_ATTACK_DAMAGE,

    patrolSpeed:
      ENEMY_PATROL_SPEED,

    chaseSpeed:
      ENEMY_CHASE_SPEED,

    detectionRange:
      ENEMY_DETECTION_RANGE,

    attackRange:
      ENEMY_ATTACK_RANGE,

    attackCooldownDuration:
      ENEMY_ATTACK_COOLDOWN,

    patrolWaitDuration:
      ENEMY_PATROL_WAIT_TIME,

    fadeDuration:
      ENEMY_FADE_DURATION,

    respawnTime:
      ENEMY_RESPAWN_TIME,

    extraFootOffset:
      ORC_EXTRA_FOOT_OFFSET,

    spriteFacingMultiplier:
      -1
  }
};

/* ==================================================
   敵人生成位置
================================================== */

/*
  目前生成三隻敵人：

  1. ORC1
  2. ORC2
  3. ORC3

  每個生成點都有自己的巡邏區域。
*/
const ENEMY_SPAWN_CONFIGS = [
  {
    id: "orc1-01",

    type: "ORC1",

    spawnX: 1100,

    patrolMinX: 850,
    patrolMaxX: 1500,

    patrolDirection: -1
  },

  {
    id: "orc2-01",

    type: "ORC2",

    spawnX: 1900,

    patrolMinX: 1650,
    patrolMaxX: 2250,

    patrolDirection: 1
  },

  {
    id: "orc3-01",

    type: "ORC3",

    spawnX: 2350,

    patrolMinX: 2200,
    patrolMaxX: 2480,

    patrolDirection: -1
  }
];

/* ==================================================
   遊戲狀態
================================================== */

let assetsLoaded =
  false;

let fakeLoadingCompleted =
  false;

let loadingSequenceStarted =
  false;

let gameStarted =
  false;

let gameLoopStarted =
  false;

let playerControlEnabled =
  false;

let stageIntroPlaying =
  false;

let orientationTransitioning =
  false;

let gameFailed =
  false;

let previousTime =
  performance.now();

/* ==================================================
   相機狀態
================================================== */

const camera = {
  x: 0,
  y: 0,

  targetX: 0,
  targetY: 0
};

/* ==================================================
   玩家狀態
================================================== */

const player = {
  spawnX: 340,

  x: 340,
  y: WORLD_GROUND_Y,

  velocityX: 0,
  velocityY: 0,

  facing: 1,

  grounded: true,
  ducking: false,

  attacking: false,
  airAttacking: false,

  hurt: false,

  animation: "idle",

  frameIndex: 0,
  frameTimer: 0,

  level:
    PLAYER_LEVEL,

  maxHp:
    PLAYER_BASE_MAX_HP +
    (
      PLAYER_LEVEL - 1
    ) *
    PLAYER_HP_PER_LEVEL,

  hp:
    PLAYER_BASE_MAX_HP +
    (
      PLAYER_LEVEL - 1
    ) *
    PLAYER_HP_PER_LEVEL,

  invincibleTimer: 0,

  attackHitEnemyIds:
    new Set()
};

/* ==================================================
   敵人狀態
================================================== */

const enemies = [];

/* ==================================================
   傷害數字狀態
================================================== */

const damageNumbers = [];

/* ==================================================
   共用工具
================================================== */

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.max(
    minimum,
    Math.min(
      maximum,
      value
    )
  );
}

function wait(
  milliseconds
) {
  return new Promise(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

function waitForNextPaint() {
  return new Promise(
    (resolve) => {
      requestAnimationFrame(
        () => {
          requestAnimationFrame(
            resolve
          );
        }
      );
    }
  );
}

function isTouchDevice() {
  return (
    window.matchMedia(
      "(pointer: coarse)"
    ).matches ||
    window.matchMedia(
      "(hover: none)"
    ).matches
  );
}

function isPortrait() {
  return (
    window.innerHeight >
    window.innerWidth
  );
}

function padNumber(
  number
) {
  return String(
    number
  ).padStart(
    2,
    "0"
  );
}

function worldToScreenX(
  worldX
) {
  return (
    worldX -
    camera.x
  );
}

function worldToScreenY(
  worldY
) {
  return (
    worldY -
    camera.y
  );
}

function rectanglesIntersect(
  first,
  second
) {
  return (
    first.x <
      second.x +
      second.width &&

    first.x +
      first.width >
      second.x &&

    first.y <
      second.y +
      second.height &&

    first.y +
      first.height >
      second.y
  );
}
