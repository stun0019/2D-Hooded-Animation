"use strict";

/* 全域 DOM、設定、遊戲狀態與共用工具 */

/* ==================================================
   DOM
================================================== */

const canvas =
  document.getElementById("game-canvas");

const context =
  canvas.getContext("2d");

const orientationScreen =
  document.getElementById("orientation-screen");

const loadingPage =
  document.getElementById("loading-page");

const loadingStatus =
  document.getElementById("loading-status");

const loadingMessage =
  document.getElementById("loading-message");

const progressBar =
  document.getElementById("progress-bar");

const progressNumber =
  document.getElementById("progress-number");

const enterDungeonButton =
  document.getElementById("enter-dungeon-button");

const stageIntro =
  document.getElementById("stage-intro");

const stageIntroTitle =
  document.getElementById("stage-intro-title");

const failScreen =
  document.getElementById("fail-screen");

const respawnButton =
  document.getElementById("respawn-button");

const attackKeySelect =
  document.getElementById("attack-key-select");

const attackKeyLabel =
  document.getElementById("attack-key-label");

const joystickZone =
  document.getElementById("joystick-zone");

const joystickBase =
  document.getElementById("joystick-base");

const joystickStick =
  document.getElementById("joystick-stick");

context.imageSmoothingEnabled = false;

/* ==================================================
   世界設定
================================================== */

const VIEW_WIDTH = 1280;
const VIEW_HEIGHT = 720;

const WORLD_WIDTH = 2560;
const WORLD_HEIGHT = 1440;

const WORLD_GROUND_Y = 1240;

const GRAVITY = 2200;
const WALK_SPEED = 230;
const RUN_SPEED = 420;
const JUMP_FORCE = 820;

const PLAYER_SCALE = 2.6;
const ENEMY_SCALE = 2.3;

const CAMERA_FOLLOW_SPEED = 5.5;

const JOYSTICK_DEAD_ZONE = 0.14;
const RUN_THRESHOLD = 0.72;
const DUCK_THRESHOLD = 0.62;

const ORIENTATION_FADE_TIME = 650;

const STAGE_INTRO_HOLD_TIME = 500;
const STAGE_INTRO_FADE_TIME = 500;
const LOADING_PAGE_FADE_TIME = 850;

/* ==================================================
   V0.6 戰鬥設定
================================================== */

const PLAYER_LEVEL = 1;
const ORC_LEVEL = 1;

const PLAYER_BASE_MAX_HP = 100;
const PLAYER_HP_PER_LEVEL = 20;
const ORC_BASE_MAX_HP = 100;

const PLAYER_ATTACK_DAMAGE = 25;
const ORC_ATTACK_DAMAGE = 18;
const BODY_CONTACT_DAMAGE = 10;

const PLAYER_INVINCIBLE_TIME = 0.5;
const BODY_KNOCKBACK_DISTANCE = 6;
const ORC_FADE_DURATION = 0.55;

const PLAYER_ATTACK_ACTIVE_START = 3;
const PLAYER_ATTACK_ACTIVE_END = 5;

const ORC_ATTACK_ACTIVE_START = 3;
const ORC_ATTACK_ACTIVE_END = 5;

/* ==================================================
   ORC1 AI
================================================== */

const ORC_PATROL_SPEED = 72;
const ORC_CHASE_SPEED = 112;

const ORC_DETECTION_RANGE = 390;
const ORC_ATTACK_RANGE = 105;

const ORC_ATTACK_COOLDOWN = 1.1;
const ORC_PATROL_WAIT_TIME = 1;

const ORC_DRAW_MARGIN = 260;

/*
  自動 Anchor 偵測完成後，
  再向下補償 4 個原始素材像素。

  4 × 2.3 = 9.2px
*/
const ORC_EXTRA_FOOT_OFFSET = 4;

/* ==================================================
   遊戲狀態
================================================== */

let assetsLoaded = false;
let fakeLoadingCompleted = false;
let loadingSequenceStarted = false;

let gameStarted = false;
let gameLoopStarted = false;

let playerControlEnabled = false;
let stageIntroPlaying = false;

let orientationTransitioning = false;
let gameFailed = false;

let previousTime =
  performance.now();

const camera = {
  x: 0,
  y: 0,

  targetX: 0,
  targetY: 0
};

const player = {
  x: 340,
  y: WORLD_GROUND_Y,

  velocityX: 0,
  velocityY: 0,

  facing: 1,

  grounded: true,
  ducking: false,

  attacking: false,
  airAttacking: false,

  animation: "idle",

  frameIndex: 0,
  frameTimer: 0,

  spawnX: 340,
  level: PLAYER_LEVEL,

  maxHp:
    PLAYER_BASE_MAX_HP +
    (PLAYER_LEVEL - 1) *
    PLAYER_HP_PER_LEVEL,

  hp:
    PLAYER_BASE_MAX_HP +
    (PLAYER_LEVEL - 1) *
    PLAYER_HP_PER_LEVEL,

  invincibleTimer: 0,
  attackHitRegistered: false
};

const orc = {
  x: 1100,
  y: WORLD_GROUND_Y,

  velocityX: 0,

  facing: -1,

  animation: "idle",

  frameIndex: 0,
  frameTimer: 0,

  state: "patrol",

  attacking: false,
  attackCooldown: 0,

  patrolMinX: 850,
  patrolMaxX: 1500,

  patrolDirection: -1,
  patrolWaitTimer: 0,

  spawnX: 1100,
  level: ORC_LEVEL,

  maxHp: ORC_BASE_MAX_HP,
  hp: ORC_BASE_MAX_HP,

  attackHitRegistered: false,

  dead: false,
  opacity: 1,
  fadeTimer: 0
};

/* ==================================================
   工具函式
================================================== */

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.max(
    minimum,
    Math.min(maximum, value)
  );
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      milliseconds
    );
  });
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
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

function padNumber(number) {
  return String(number).padStart(
    2,
    "0"
  );
}

function worldToScreenX(worldX) {
  return worldX - camera.x;
}

function worldToScreenY(worldY) {
  return worldY - camera.y;
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
