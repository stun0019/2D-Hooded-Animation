"use strict";

/* ==================================================
   動畫定義
================================================== */

const playerAnimationDefinitions = {
  idle: {
    folder: "Idle",
    prefix: "idle",
    frameCount: 2,
    frameDuration: 0.42,
    loop: true
  },

  walk: {
    folder: "Walk",
    prefix: "Walk",
    frameCount: 4,
    frameDuration: 0.13,
    loop: true
  },

  run: {
    folder: "Run",
    prefix: "Run",
    frameCount: 8,
    frameDuration: 0.075,
    loop: true
  },

  duck: {
    folder: "Duck",
    prefix: "Duck",
    frameCount: 6,
    frameDuration: 0.08,
    loop: false
  },

  jump: {
    folder: "Jump",
    prefix: "Jump",
    frameCount: 8,
    frameDuration: 0.09,
    loop: false
  },

  attack: {
    folder: "ATK",
    prefix: "ATK",
    frameCount: 8,
    frameDuration: 0.065,
    loop: false
  }
};

const enemyAnimationDefinitions = {
  idle: {
    folder: "Idle",
    prefix: "Idle",
    frameCount: 4,
    frameDuration: 0.19,
    loop: true
  },

  walk: {
    folder: "Walk",
    prefix: "Walk",
    frameCount: 6,
    frameDuration: 0.12,
    loop: true
  },

  attack: {
    folder: "ATK",
    prefix: "ATK",
    frameCount: 8,
    frameDuration: 0.085,
    loop: false
  }
};

const playerAnimations = {};
const enemyAnimations = {};

/* ==================================================
   圖片載入
================================================== */

function loadImage(path) {
  return new Promise(
    (resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        resolve(image);
      };

      image.onerror = () => {
        reject(
          new Error(
            `無法載入圖片：${path}`
          )
        );
      };

      image.src = path;
    }
  );
}

/* ==================================================
   ORC 腳底 Anchor 偵測
================================================== */

function calculateSpriteFootOffset(image) {
  const scanCanvas =
    document.createElement("canvas");

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
        willReadFrequently: true
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
    只掃描圖片中央 30%～70% 區域，
    避免左右武器被誤判為腳底。
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

  let lowestOpaqueY = -1;

  for (
    let y =
      scanCanvas.height - 1;
    y >= 0;
    y -= 1
  ) {
    let foundOpaquePixel = false;

    for (
      let x = startX;
      x < endX;
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

      if (
        imageData.data[
          alphaIndex
        ] > 20
      ) {
        foundOpaquePixel = true;
        break;
      }
    }

    if (foundOpaquePixel) {
      lowestOpaqueY = y;
      break;
    }
  }

  if (lowestOpaqueY < 0) {
    return 0;
  }

  return (
    scanCanvas.height -
    1 -
    lowestOpaqueY
  );
}

/* ==================================================
   動畫群組載入
================================================== */

async function loadAnimationGroup(
  destination,
  definitions,
  basePath,
  analyzeFootOffsets = false
) {
  const tasks = [];

  for (
    const [
      animationName,
      definition
    ] of Object.entries(definitions)
  ) {
    destination[
      animationName
    ] = {
      frames: [],
      footOffsets: [],

      frameDuration:
        definition.frameDuration,

      loop:
        definition.loop
    };

    for (
      let frameNumber = 1;
      frameNumber <=
        definition.frameCount;
      frameNumber += 1
    ) {
      const path =
        basePath +
        "/" +
        definition.folder +
        "/" +
        definition.prefix +
        padNumber(frameNumber) +
        ".png";

      tasks.push(
        loadImage(path).then(
          (image) => {
            const frameIndex =
              frameNumber - 1;

            destination[
              animationName
            ].frames[
              frameIndex
            ] = image;

            destination[
              animationName
            ].footOffsets[
              frameIndex
            ] =
              analyzeFootOffsets
                ? calculateSpriteFootOffset(
                    image
                  )
                : 0;
          }
        )
      );
    }
  }

  await Promise.all(tasks);
}

/* ==================================================
   載入全部角色素材
================================================== */

async function loadAllAnimations() {
  await Promise.all([
    loadAnimationGroup(
      playerAnimations,
      playerAnimationDefinitions,
      "2D_Character",
      false
    ),

    loadAnimationGroup(
      enemyAnimations,
      enemyAnimationDefinitions,
      "2D_Enemy/ORC1",
      true
    )
  ]);
}
