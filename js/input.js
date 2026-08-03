"use strict";

/* 鍵盤、攻擊鍵、虛擬搖桿、手機按鈕與輸入重置 */

/* ==================================================
   輸入
================================================== */

const input = {
  left: false,
  right: false,
  run: false,
  duck: false,
  jump: false,
  attack: false
};

const pressed = {
  jump: false,
  attack: false
};

const joystick = {
  active: false,
  pointerId: null,

  centerX: 0,
  centerY: 0,
  radius: 0,

  x: 0,
  y: 0,
  magnitude: 0
};

/* ==================================================
   攻擊鍵
================================================== */

const ATTACK_KEY_STORAGE =
  "hoodedCharacterAttackKey";

const allowedAttackKeys = {
  KeyZ: "Z",
  KeyX: "X",
  KeyC: "C",
  KeyV: "V",
  KeyJ: "J",
  KeyK: "K",
  KeyL: "L"
};

let attackKeyCode =
  localStorage.getItem(
    ATTACK_KEY_STORAGE
  ) || "KeyZ";

if (!allowedAttackKeys[attackKeyCode]) {
  attackKeyCode = "KeyZ";
}

attackKeySelect.value =
  attackKeyCode;

attackKeyLabel.textContent =
  allowedAttackKeys[attackKeyCode];

attackKeySelect.addEventListener(
  "change",
  () => {
    attackKeyCode =
      attackKeySelect.value;

    localStorage.setItem(
      ATTACK_KEY_STORAGE,
      attackKeyCode
    );

    attackKeyLabel.textContent =
      allowedAttackKeys[attackKeyCode];

    resetAllInputs();

    canvas.focus();
  }
);

/* ==================================================
   鍵盤輸入
================================================== */

function getControlFromKey(code) {
  if (
    code === attackKeyCode
  ) {
    return "attack";
  }

  const keyBindings = {
    ArrowLeft: "left",
    KeyA: "left",

    ArrowRight: "right",
    KeyD: "right",

    ArrowUp: "jump",
    KeyW: "jump",
    Space: "jump",

    ArrowDown: "duck",
    KeyS: "duck",

    ShiftLeft: "run",
    ShiftRight: "run"
  };

  return (
    keyBindings[code] ||
    null
  );
}

function setControl(
  controlName,
  active,
  isNewPress = false
) {
  if (
    !(controlName in input)
  ) {
    return;
  }

  if (
    active &&
    isNewPress &&
    (
      controlName ===
        "jump" ||
      controlName ===
        "attack"
    )
  ) {
    pressed[
      controlName
    ] = true;
  }

  input[
    controlName
  ] = active;
}

window.addEventListener(
  "keydown",
  (event) => {
    if (
      !gameStarted ||
      !playerControlEnabled ||
      gameFailed ||
      document.activeElement ===
        attackKeySelect
    ) {
      return;
    }

    const controlName =
      getControlFromKey(
        event.code
      );

    if (!controlName) {
      return;
    }

    event.preventDefault();

    setControl(
      controlName,
      true,
      !input[
        controlName
      ]
    );
  }
);

window.addEventListener(
  "keyup",
  (event) => {
    const controlName =
      getControlFromKey(
        event.code
      );

    if (!controlName) {
      return;
    }

    event.preventDefault();

    setControl(
      controlName,
      false
    );
  }
);

/* ==================================================
   虛擬搖桿
================================================== */

function updateJoystickCenter() {
  const rect =
    joystickBase.getBoundingClientRect();

  joystick.centerX =
    rect.left +
    rect.width / 2;

  joystick.centerY =
    rect.top +
    rect.height / 2;

  joystick.radius =
    rect.width * 0.34;
}

function updateJoystickPosition(
  clientX,
  clientY
) {
  const deltaX =
    clientX -
    joystick.centerX;

  const deltaY =
    clientY -
    joystick.centerY;

  const distance =
    Math.hypot(
      deltaX,
      deltaY
    );

  const limitedDistance =
    Math.min(
      distance,
      joystick.radius
    );

  const angle =
    Math.atan2(
      deltaY,
      deltaX
    );

  const visualX =
    Math.cos(
      angle
    ) *
    limitedDistance;

  const visualY =
    Math.sin(
      angle
    ) *
    limitedDistance;

  joystickStick.style.transform =
    `translate(
      calc(-50% + ${visualX}px),
      calc(-50% + ${visualY}px)
    )`;

  const normalizedX =
    joystick.radius > 0
      ? visualX /
        joystick.radius
      : 0;

  const normalizedY =
    joystick.radius > 0
      ? visualY /
        joystick.radius
      : 0;

  joystick.x =
    Math.abs(
      normalizedX
    ) <
    JOYSTICK_DEAD_ZONE
      ? 0
      : normalizedX;

  joystick.y =
    Math.abs(
      normalizedY
    ) <
    JOYSTICK_DEAD_ZONE
      ? 0
      : normalizedY;

  joystick.magnitude =
    Math.min(
      1,
      Math.hypot(
        joystick.x,
        joystick.y
      )
    );
}

function resetJoystick() {
  joystick.active = false;
  joystick.pointerId = null;

  joystick.x = 0;
  joystick.y = 0;
  joystick.magnitude = 0;

  joystickStick.style.transform =
    "translate(-50%, -50%)";

  joystickZone.classList.remove(
    "active"
  );
}

joystickZone.addEventListener(
  "pointerdown",
  (event) => {
    if (
      !gameStarted ||
      !playerControlEnabled ||
      gameFailed
    ) {
      return;
    }

    event.preventDefault();

    updateJoystickCenter();

    joystick.active = true;

    joystick.pointerId =
      event.pointerId;

    joystickZone.classList.add(
      "active"
    );

    if (
      joystickZone.setPointerCapture
    ) {
      joystickZone.setPointerCapture(
        event.pointerId
      );
    }

    updateJoystickPosition(
      event.clientX,
      event.clientY
    );
  }
);

joystickZone.addEventListener(
  "pointermove",
  (event) => {
    if (
      !gameStarted ||
      !playerControlEnabled ||
      !joystick.active ||
      event.pointerId !==
        joystick.pointerId
    ) {
      return;
    }

    event.preventDefault();

    updateJoystickPosition(
      event.clientX,
      event.clientY
    );
  }
);

joystickZone.addEventListener(
  "pointerup",
  resetJoystick
);

joystickZone.addEventListener(
  "pointercancel",
  resetJoystick
);

joystickZone.addEventListener(
  "lostpointercapture",
  resetJoystick
);

/* ==================================================
   手機按鈕
================================================== */

document
  .querySelectorAll(
    ".action-button"
  )
  .forEach((button) => {
    const controlName =
      button.dataset.control;

    function activate(event) {
      if (
        !gameStarted ||
        !playerControlEnabled ||
        gameFailed
      ) {
        return;
      }

      event.preventDefault();

      button.classList.add(
        "active"
      );

      setControl(
        controlName,
        true,
        !input[
          controlName
        ]
      );

      if (
        button.setPointerCapture
      ) {
        button.setPointerCapture(
          event.pointerId
        );
      }
    }

    function deactivate(event) {
      event.preventDefault();

      button.classList.remove(
        "active"
      );

      setControl(
        controlName,
        false
      );
    }

    button.addEventListener(
      "pointerdown",
      activate
    );

    button.addEventListener(
      "pointerup",
      deactivate
    );

    button.addEventListener(
      "pointercancel",
      deactivate
    );

    button.addEventListener(
      "lostpointercapture",
      deactivate
    );

    button.addEventListener(
      "contextmenu",
      (event) => {
        event.preventDefault();
      }
    );
  });

/* ==================================================
   輸入重置
================================================== */

function resetAllInputs() {
  for (
    const controlName of
    Object.keys(input)
  ) {
    input[
      controlName
    ] = false;
  }

  pressed.jump = false;
  pressed.attack = false;

  resetJoystick();

  document
    .querySelectorAll(
      ".action-button"
    )
    .forEach((button) => {
      button.classList.remove(
        "active"
      );
    });
}

window.addEventListener(
  "blur",
  resetAllInputs
);

document.addEventListener(
  "visibilitychange",
  () => {
    if (document.hidden) {
      resetAllInputs();
    }
  }
);

window.addEventListener(
  "resize",
  () => {
    handleOrientationState();

    window.setTimeout(
      () => {
        updateJoystickCenter();
      },
      100
    );
  }
);

window.addEventListener(
  "orientationchange",
  () => {
    resetAllInputs();

    window.setTimeout(
      () => {
        handleOrientationState();
        updateJoystickCenter();
      },
      250
    );
  }
);
