const Scene = require('Scene');
const Diagnostics = require("Diagnostics");
const Patches = require("Patches");
const Reactive = require("Reactive");

(async function () {  // Enables async/await in JS [part 1]
  // Status

  // Access scene objects
  const [
    bothHandsUp,
    bothHandsDown,
    oneHandUp,
    bothHandsLeft,
    bothHandsRight,
  ] = await Promise.all([
    Patches.outputs.getPulse("bothHandsUp"),
    Patches.outputs.getPulse("bothHandsDown"),
    Patches.outputs.getPulse("oneHandUp"),
    Patches.outputs.getPulse("bothHandsLeft"),
    Patches.outputs.getPulse("bothHandsRight"),
  ]);

  function onBothHandsUp() {
    Diagnostics.log("bothHandsUp");
    Patches.inputs.setPulse("animateInWatermelon", Reactive.once());
  }

  function onBothHandsDown() {
    Diagnostics.log("bothHandsDown");
  }

  function onOneHandUp() {
    Diagnostics.log("oneHandUp");
  }

  function onBothHandsLeft() {
    Diagnostics.log("bothHandsLeft");
  }

  function onBothHandsRight() {
    Diagnostics.log("bothHandsRight");
  }

  // Add signal handlers
  bothHandsUp.subscribe(onBothHandsUp);
  bothHandsDown.subscribe(onBothHandsDown);
  oneHandUp.subscribe(onOneHandUp);
  bothHandsLeft.subscribe(onBothHandsLeft);
  bothHandsRight.subscribe(onBothHandsRight);

})();
