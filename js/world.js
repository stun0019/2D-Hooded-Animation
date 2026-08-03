"use strict";

/* 相機、地牢牆面、柱子、火把、地面與陰影 */

/* ==================================================
   相機
================================================== */

function calculateCameraTarget() {
  const horizontalAnchor =
    VIEW_WIDTH * 0.42;

  const verticalAnchor =
    VIEW_HEIGHT * 0.58;

  camera.targetX =
    player.x -
    horizontalAnchor;

  camera.targetY =
    player.y -
    verticalAnchor;

  camera.targetX = clamp(
    camera.targetX,
    0,
    WORLD_WIDTH -
      VIEW_WIDTH
  );

  camera.targetY = clamp(
    camera.targetY,
    0,
    WORLD_HEIGHT -
      VIEW_HEIGHT
  );
}

function snapCameraToPlayer() {
  calculateCameraTarget();

  camera.x =
    camera.targetX;

  camera.y =
    camera.targetY;
}

function updateCamera(
  deltaTime
) {
  calculateCameraTarget();

  const smoothing =
    1 -
    Math.exp(
      -CAMERA_FOLLOW_SPEED *
      deltaTime
    );

  camera.x +=
    (
      camera.targetX -
      camera.x
    ) *
    smoothing;

  camera.y +=
    (
      camera.targetY -
      camera.y
    ) *
    smoothing;

  camera.x = clamp(
    camera.x,
    0,
    WORLD_WIDTH -
      VIEW_WIDTH
  );

  camera.y = clamp(
    camera.y,
    0,
    WORLD_HEIGHT -
      VIEW_HEIGHT
  );
}

/* ==================================================
   世界繪製
================================================== */

function drawBackground() {
  const gradient =
    context.createLinearGradient(
      0,
      0,
      0,
      VIEW_HEIGHT
    );

  gradient.addColorStop(
    0,
    "#252e40"
  );

  gradient.addColorStop(
    1,
    "#111722"
  );

  context.fillStyle =
    gradient;

  context.fillRect(
    0,
    0,
    VIEW_WIDTH,
    VIEW_HEIGHT
  );
}

function drawDungeonWalls() {
  const tileSize = 96;

  const startColumn =
    Math.floor(
      camera.x /
      tileSize
    );

  const endColumn =
    Math.ceil(
      (
        camera.x +
        VIEW_WIDTH
      ) /
      tileSize
    );

  const startRow =
    Math.floor(
      camera.y /
      tileSize
    );

  const endRow =
    Math.ceil(
      (
        camera.y +
        VIEW_HEIGHT
      ) /
      tileSize
    );

  for (
    let row = startRow;
    row <= endRow;
    row += 1
  ) {
    for (
      let column =
        startColumn;
      column <= endColumn;
      column += 1
    ) {
      const worldX =
        column *
        tileSize;

      const worldY =
        row *
        tileSize;

      const screenX =
        worldToScreenX(
          worldX
        );

      const screenY =
        worldToScreenY(
          worldY
        );

      const alternate =
        (
          row +
          column
        ) %
          2 ===
        0;

      context.fillStyle =
        alternate
          ? "rgba(255,255,255,0.018)"
          : "rgba(0,0,0,0.025)";

      context.fillRect(
        Math.floor(
          screenX
        ),
        Math.floor(
          screenY
        ),
        tileSize + 1,
        tileSize + 1
      );

      context.strokeStyle =
        "rgba(255,255,255,0.025)";

      context.strokeRect(
        Math.floor(
          screenX
        ),
        Math.floor(
          screenY
        ),
        tileSize,
        tileSize
      );
    }
  }
}

/* ==================================================
   柱子與火把
================================================== */

function drawDungeonDecorations() {
  const pillars = [
    {
      x: 760,
      y: 930
    },
    {
      x: 1200,
      y: 930
    },
    {
      x: 1660,
      y: 930
    },
    {
      x: 2140,
      y: 930
    }
  ];

  for (
    const pillar of pillars
  ) {
    const screenX =
      worldToScreenX(
        pillar.x
      );

    const screenY =
      worldToScreenY(
        pillar.y
      );

    if (
      screenX < -160 ||
      screenX >
        VIEW_WIDTH + 160
    ) {
      continue;
    }

    context.fillStyle =
      "#202937";

    context.fillRect(
      screenX - 42,
      screenY,
      84,
      310
    );

    context.fillStyle =
      "#303b4c";

    context.fillRect(
      screenX - 55,
      screenY,
      110,
      24
    );

    context.fillRect(
      screenX - 55,
      screenY + 286,
      110,
      24
    );

    context.fillStyle =
      "rgba(255,255,255,0.045)";

    context.fillRect(
      screenX - 26,
      screenY + 34,
      12,
      235
    );
  }

  const torches = [
    {
      x: 520,
      y: 1040
    },
    {
      x: 980,
      y: 1040
    },
    {
      x: 1440,
      y: 1040
    },
    {
      x: 1900,
      y: 1040
    },
    {
      x: 2340,
      y: 1040
    }
  ];

  for (
    const torch of torches
  ) {
    const screenX =
      worldToScreenX(
        torch.x
      );

    const screenY =
      worldToScreenY(
        torch.y
      );

    if (
      screenX < -100 ||
      screenX >
        VIEW_WIDTH + 100
    ) {
      continue;
    }

    /*
      火把握柄
    */
    context.fillStyle =
      "#4a3328";

    context.fillRect(
      screenX - 5,
      screenY,
      10,
      56
    );

    /*
      火把光暈
    */
    const glow =
      context.createRadialGradient(
        screenX,
        screenY,
        2,
        screenX,
        screenY,
        90
      );

    glow.addColorStop(
      0,
      "rgba(227,121,61,0.42)"
    );

    glow.addColorStop(
      1,
      "rgba(227,121,61,0)"
    );

    context.fillStyle =
      glow;

    context.beginPath();

    context.arc(
      screenX,
      screenY,
      90,
      0,
      Math.PI * 2
    );

    context.fill();

    /*
      火焰
    */
    context.fillStyle =
      "#d96e3d";

    context.beginPath();

    context.moveTo(
      screenX,
      screenY - 30
    );

    context.lineTo(
      screenX - 12,
      screenY
    );

    context.lineTo(
      screenX,
      screenY + 7
    );

    context.lineTo(
      screenX + 12,
      screenY
    );

    context.closePath();
    context.fill();
  }
}

/* ==================================================
   地面
================================================== */

function drawGround() {
  const screenGroundY =
    worldToScreenY(
      WORLD_GROUND_Y
    );

  context.fillStyle =
    "#303846";

  context.fillRect(
    0,
    screenGroundY,
    VIEW_WIDTH,
    Math.max(
      0,
      VIEW_HEIGHT -
        screenGroundY
    )
  );

  context.fillStyle =
    "#697588";

  context.fillRect(
    0,
    screenGroundY,
    VIEW_WIDTH,
    5
  );

  const floorTileWidth = 84;

  const firstTile =
    Math.floor(
      camera.x /
      floorTileWidth
    );

  const lastTile =
    Math.ceil(
      (
        camera.x +
        VIEW_WIDTH
      ) /
      floorTileWidth
    );

  context.fillStyle =
    "rgba(255,255,255,0.06)";

  for (
    let tile = firstTile;
    tile <= lastTile;
    tile += 1
  ) {
    const worldX =
      tile *
      floorTileWidth;

    const screenX =
      worldToScreenX(
        worldX
      );

    context.fillRect(
      screenX,
      screenGroundY + 38,
      48,
      4
    );
  }
}

/* ==================================================
   角色陰影
================================================== */

function drawEntityShadow(
  worldX,
  radiusX,
  radiusY
) {
  const screenX =
    worldToScreenX(
      worldX
    );

  const screenY =
    worldToScreenY(
      WORLD_GROUND_Y
    );

  context.save();

  context.globalAlpha =
    0.25;

  context.fillStyle =
    "#000000";

  context.beginPath();

  context.ellipse(
    screenX,
    screenY + 5,
    radiusX,
    radiusY,
    0,
    0,
    Math.PI * 2
  );

  context.fill();

  context.restore();
}
