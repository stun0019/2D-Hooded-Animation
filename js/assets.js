"use strict";

/*
  Hooded Escape

  玩家動畫、ORC1／ORC2／ORC3 動畫、
  圖片載入與敵人腳底 Anchor 偵測。
*/

/* ==================================================
   玩家動畫定義
================================================== */

const playerAnimationDefinitions = {
  idle: {
    folder: "Idle",
    prefix: "idle",

    frameNumbers: [
      1,
      2
    ],

    frameDuration: 0.42,
    loop: true
  },

  walk: {
    folder: "Walk",
    prefix: "Walk",

    frameNumbers: [
      1,
      2,
      3,
      4
    ],

    frameDuration: 0.13,
    loop: true
  },

  run: {
    folder: "Run",
    prefix: "Run",

    frameNumbers: [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8
    ],

    frameDuration: 0.075,
    loop: true
  },

  duck: {
    folder: "Duck",
    prefix: "Duck",

    frameNumbers: [
      1,
      2,
      3,
      4,
      5,
      6
    ],

    frameDuration: 0.08,
    loop: false
  },

  jump: {
    folder: "Jump",
    prefix: "Jump",

    frameNumbers: [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8
    ],

    frameDuration: 0.09,
    loop: false
  },

  attack: {
    folder: "ATK",
    prefix: "ATK",

    frameNumbers: [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8
    ],

    frameDuration: 0.065,
    loop: false
  },

  hurt: {
    folder: "Hurt",
    prefix: "Hurt",

    frameNumbers: [
      1,
      2
    ],

    frameDuration: 0.12,
    loop: false
  }
};

/* ==================================================
   敵人動畫定義
================================================== */

const enemyAnimationDefinitions = {
  ORC1: {
    idle: {
      folder: "Idle",
      prefix: "Idle",

      frameNumbers: [
        1,
        2,
        3,
        4
      ],

      frameDuration: 0.19,
      loop: true
    },

    walk: {
      folder: "Walk",
      prefix: "Walk",

      frameNumbers: [
        1,
        2,
        3,
        4,
        5,
        6
      ],

      frameDuration: 0.12,
      loop: true
    },

    attack: {
      folder: "ATK",
      prefix: "ATK",

      frameNumbers: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8
      ],

      frameDuration: 0.085,
      loop: false
    }
  },

  ORC2: {
    idle: {
      folder: "Idle",
      prefix: "Idle",

      frameNumbers: [
        1,
        2,
        3,
        4
      ],

      frameDuration: 0.19,
      loop: true
    },

    /*
      ORC2 Walk 圖片的原始命名
      從 Walk12.png 開始。
    */
    walk: {
      folder: "Walk",
      prefix: "Walk",

      frameNumbers: [
        12,
        13,
        14,
        15,
        16,
        17
      ],

      frameDuration: 0.12,
      loop: true
    },

    attack: {
      folder: "ATK",
      prefix: "ATK",

      frameNumbers: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8
      ],

      frameDuration: 0.085,
      loop: false
    }
  },

  ORC3: {
    /*
      ORC3 Idle 素材：

      2D_Enemy/ORC3/Idle/Idle01.png
      2D_Enemy/ORC3/Idle/Idle02.png
    */
    idle: {
      folder: "Idle",
      prefix: "Idle",

      frameNumbers: [
        1,
        2
      ],

      frameDuration: 0.22,
      loop: true
    },

    /*
      ORC3 目前尚未加入正式 Walk 素材。

      巡邏與追蹤玩家時，
      暫時使用 Idle01、Idle02。
    */
    walk: {
      folder: "Idle",
      prefix: "Idle",

      frameNumbers: [
        1,
        2
      ],

      frameDuration: 0.18,
      loop: true
    },

    /*
      ORC3 正式攻擊素材：

      2D_Enemy/ORC3/ATK/ATK01.png
      至
      2D_Enemy/ORC3/ATK/ATK08.png
    */
    attack: {
      folder: "ATK",
      prefix: "ATK",

      frameNumbers: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8
      ],

      frameDuration: 0.085,
      loop: false
    }
  }
};

/* ==================================================
   動畫素材容器
================================================== */

/*
  玩家動畫使用方式：

  playerAnimations.idle
  playerAnimations.walk
  playerAnimations.attack
  playerAnimations.hurt
*/
const playerAnimations = {};

/*
  敵人動畫使用方式：

  enemyAnimations.ORC1.idle
  enemyAnimations.ORC1.walk
  enemyAnimations.ORC1.attack

  enemyAnimations.ORC2.idle
  enemyAnimations.ORC2.walk
  enemyAnimations.ORC2.attack

  enemyAnimations.ORC3.idle
  enemyAnimations.ORC3.walk
  enemyAnimations.ORC3.attack
*/
const enemyAnimations = {};

/* ==================================================
   圖片載入
================================================== */

function loadImage(
  path
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image();

      image.onload =
        () => {
          resolve(
            image
          );
        };

      image.onerror =
        () => {
          reject(
            new Error(
              `無法載入圖片：${path}`
            )
          );
        };

      image.src =
        path;
    }
  );
}

/* ==================================================
   敵人腳底 Anchor 偵測
================================================== */

function calculateSpriteFootOffset(
  image
) {
  const scanCanvas =
    document.createElement(
      "canvas"
    );

  scanCanvas.width =
    image.naturalWidth ||
    image.width;

  scanCanvas.height =
    image.naturalHeight ||
    image.height;

  const scanContext =
    scanCanvas.getContext(
      "2d",
      {
        willReadFrequently:
          true
      }
    );

  if (!scanContext) {
    return 0;
  }

  scanContext.clearRect(
    0,
    0,
    scanCanvas.width,
    scanCanvas.height
  );

  scanContext.drawImage(
    image,
    0,
    0
  );

  let imageData;

  try {
    imageData =
      scanContext.getImageData(
        0,
        0,
        scanCanvas.width,
        scanCanvas.height
      );
  } catch (error) {
    console.warn(
      "無法分析 Sprite Anchor：",
      error
    );

    return 0;
  }

  /*
    只掃描圖片中央 30%～70%。

    避免左右兩側的武器、
    斧頭或其他突出物，
    被誤判為角色腳底。
  */
  const startX =
    Math.floor(
      scanCanvas.width *
      0.3
    );

  const endX =
    Math.ceil(
      scanCanvas.width *
      0.7
    );

  let lowestOpaqueY =
    -1;

  for (
    let y =
      scanCanvas.height - 1;

    y >= 0;

    y -= 1
  ) {
    let foundOpaquePixel =
      false;

    for (
      let x =
        startX;

      x <
        endX;

      x += 1
    ) {
      const alphaIndex =
        (
          y *
          scanCanvas.width +
          x
        ) *
          4 +
        3;

      const alpha =
        imageData.data[
          alphaIndex
        ];

      if (
        alpha >
        20
      ) {
        foundOpaquePixel =
          true;

        break;
      }
    }

    if (
      foundOpaquePixel
    ) {
      lowestOpaqueY =
        y;

      break;
    }
  }

  if (
    lowestOpaqueY <
    0
  ) {
    return 0;
  }

  /*
    回傳圖片最底部透明區域高度。
  */
  return (
    scanCanvas.height -
    1 -
    lowestOpaqueY
  );
}

/* ==================================================
   單一動畫載入
================================================== */

async function loadAnimation(
  definition,
  basePath,
  analyzeFootOffsets
) {
  const animation = {
    frames: [],
    footOffsets: [],

    frameDuration:
      definition.frameDuration,

    loop:
      definition.loop
  };

  const tasks =
    definition.frameNumbers.map(
      (
        frameNumber,
        destinationIndex
      ) => {
        const path =
          basePath +
          "/" +
          definition.folder +
          "/" +
          definition.prefix +
          padNumber(
            frameNumber
          ) +
          ".png";

        return loadImage(
          path
        ).then(
          (image) => {
            animation.frames[
              destinationIndex
            ] =
              image;

            animation.footOffsets[
              destinationIndex
            ] =
              analyzeFootOffsets
                ? calculateSpriteFootOffset(
                    image
                  )
                : 0;
          }
        );
      }
    );

  await Promise.all(
    tasks
  );

  return animation;
}

/* ==================================================
   動畫群組載入
================================================== */

async function loadAnimationGroup(
  destination,
  definitions,
  basePath,
  analyzeFootOffsets =
    false
) {
  const tasks = [];

  for (
    const [
      animationName,
      definition
    ] of Object.entries(
      definitions
    )
  ) {
    tasks.push(
      loadAnimation(
        definition,
        basePath,
        analyzeFootOffsets
      ).then(
        (
          animation
        ) => {
          destination[
            animationName
          ] =
            animation;
        }
      )
    );
  }

  await Promise.all(
    tasks
  );
}

/* ==================================================
   玩家動畫載入
================================================== */

async function loadPlayerAnimations() {
  await loadAnimationGroup(
    playerAnimations,
    playerAnimationDefinitions,
    "2D_Character",
    false
  );
}

/* ==================================================
   敵人動畫載入
================================================== */

async function loadEnemyAnimations() {
  const tasks = [];

  for (
    const [
      enemyType,
      definitions
    ] of Object.entries(
      enemyAnimationDefinitions
    )
  ) {
    const typeConfig =
      ENEMY_TYPE_CONFIGS[
        enemyType
      ];

    if (!typeConfig) {
      throw new Error(
        `找不到敵人設定：${enemyType}`
      );
    }

    enemyAnimations[
      enemyType
    ] = {};

    tasks.push(
      loadAnimationGroup(
        enemyAnimations[
          enemyType
        ],
        definitions,
        typeConfig.basePath,
        true
      )
    );
  }

  await Promise.all(
    tasks
  );
}

/* ==================================================
   載入全部動畫素材
================================================== */

async function loadAllAnimations() {
  await Promise.all([
    loadPlayerAnimations(),
    loadEnemyAnimations()
  ]);
}
