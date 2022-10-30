const Scene = require('Scene');
const Diagnostics = require("Diagnostics");
const Patches = require("Patches");
const Reactive = require("Reactive");

(async function () {
  // States
  enum State {
    Start = "Start",
    CutWatermelon = "CutWatermelon",
    PushOutHalves = "PushOutHalves",
    ShowTaijitu = "ShowTaijitu",
  }

  let state = State.Start;

  const startSubstates = {
    hasSeenBothHandsUp: false,
    hasSeenBothHandsDown: false,
  };

  const cutWatermelonSubstates = {
    hasSeenOneHandUp: false,
    hasSeenBothHandsDown: false,
  };

  const pushOutHalvesSubstates = {
    hasAnimatedOutWatermelonLeft: false,
    hasAnimatedOutWatermelonRight: false,
  };

  const showTaijituSubstates = {
    hasSeenBothHandsUp: false,
    hasSeenBothHandsDown: false,
  };

  // State management

  const setState = function(newState: State) {
      state = newState;
      Diagnostics.log("STATE: " + state);
  }

  const stateManager = {
    Start: {
      onOneHandUp() {
        if (
          startSubstates.hasSeenBothHandsUp &&
          startSubstates.hasSeenBothHandsDown
        ) {
          // We are still waiting for animateInWatermelon to finish, but the user has already lifted one hand. We need to process this signal now instead of waiting until CutWatermelon state, because otherwise, the user has to put the hand down, and up again in order to get the signal processed.
          cutWatermelonSubstates.hasSeenOneHandUp = true;
        }
      },
      onBothHandsUp() {
        startSubstates.hasSeenBothHandsUp = true;
      },
      onBothHandsDown() {
        if (
          startSubstates.hasSeenBothHandsUp &&
          !startSubstates.hasSeenBothHandsDown
        ) {
          startSubstates.hasSeenBothHandsDown = true;
          Diagnostics.log("ANIMATION: animateInWatermelon");
          Patches.inputs.setPulse("animateInWatermelon", Reactive.once());
        } else if (
          startSubstates.hasSeenBothHandsUp &&
          startSubstates.hasSeenBothHandsDown &&
          cutWatermelonSubstates.hasSeenOneHandUp &&
          !cutWatermelonSubstates.hasSeenBothHandsDown
        ) {
          // We are still waiting for animateInWatermelon to finish, but the user has already performed the cut gesture. We need to process this signal now instead of waiting until CutWatermelon state, because otherwise, the user has to put the hand down, and up again in order to get the signal processed.
          cutWatermelonSubstates.hasSeenBothHandsDown = true;
        }
      },
      onWatermelonAnimatedIn() {
        setState(State.CutWatermelon);

        if (
          cutWatermelonSubstates.hasSeenOneHandUp &&
          cutWatermelonSubstates.hasSeenBothHandsDown
        ) {
          // User hasn already finished the cut gesture before animateInWatermelon finishes. Play cutWatermelon animation immediately.
          setState(State.CutWatermelon);
          Diagnostics.log("ANIMATION: cutWatermelon");
          Patches.inputs.setPulse("cutWatermelon", Reactive.once());
        }
      },
    },
    CutWatermelon: {
      onOneHandUp() {
        cutWatermelonSubstates.hasSeenOneHandUp = true;
      },
      onBothHandsDown() {
        if (
          cutWatermelonSubstates.hasSeenOneHandUp &&
          !cutWatermelonSubstates.hasSeenBothHandsDown
        ) {
          cutWatermelonSubstates.hasSeenBothHandsDown = true;
          Diagnostics.log("ANIMATION: cutWatermelon");
          Patches.inputs.setPulse("cutWatermelon", Reactive.once());
        }
      },
      onWatermelonCut() {
        setState(State.PushOutHalves);
      },
    },
    PushOutHalves: {
      onBothHandsLeft() {
        if (!pushOutHalvesSubstates.hasAnimatedOutWatermelonLeft) {
          pushOutHalvesSubstates.hasAnimatedOutWatermelonLeft = true;
          Diagnostics.log("ANIMATION: animateOutWatermelonLeft");
          Patches.inputs.setPulse("animateOutWatermelonLeft", Reactive.once());

          if (pushOutHalvesSubstates.hasAnimatedOutWatermelonRight) {
            setState(State.ShowTaijitu);
          }
        }
      },
      onBothHandsRight() {
        if (!pushOutHalvesSubstates.hasAnimatedOutWatermelonRight) {
          pushOutHalvesSubstates.hasAnimatedOutWatermelonRight = true;
          Diagnostics.log("ANIMATION: animateOutWatermelonRight");
          Patches.inputs.setPulse("animateOutWatermelonRight", Reactive.once());

          if (pushOutHalvesSubstates.hasAnimatedOutWatermelonLeft) {
            setState(State.ShowTaijitu);
          }
        }
      },
    },
    ShowTaijitu: {
      onBothHandsUp() {
        showTaijituSubstates.hasSeenBothHandsUp = true;
      },
      onBothHandsDown() {
        if (
          showTaijituSubstates.hasSeenBothHandsUp &&
          !showTaijituSubstates.hasSeenBothHandsDown
        ) {
          showTaijituSubstates.hasSeenBothHandsDown = true;
          Diagnostics.log("ANIMATION: animateInTaijitu");
          Patches.inputs.setPulse("animateInTaijitu", Reactive.once());
        }
      },
    },
  };

  Diagnostics.log("STATE: " + state);

  // Access scene objects and signals
  const [
    bothHandsUp,
    bothHandsDown,
    oneHandUp,
    bothHandsLeft,
    bothHandsRight,
    watermelonAnimatedIn,
    watermelonCut,
  ] = await Promise.all([
    Patches.outputs.getPulse("bothHandsUp"),
    Patches.outputs.getPulse("bothHandsDown"),
    Patches.outputs.getPulse("oneHandUp"),
    Patches.outputs.getPulse("bothHandsLeft"),
    Patches.outputs.getPulse("bothHandsRight"),
    Patches.outputs.getPulse("watermelonAnimatedIn"),
    Patches.outputs.getPulse("watermelonCut"),
  ]);

  // Signal handlers
  function onBothHandsUp() {
    Diagnostics.log("SIGNAL: bothHandsUp");

    if (stateManager.hasOwnProperty(state)) {
      if (stateManager[state].hasOwnProperty("onBothHandsUp")) {
        stateManager[state].onBothHandsUp();
      }
    }
  }

  function onBothHandsDown() {
    Diagnostics.log("SIGNAL: bothHandsDown");

    if (stateManager.hasOwnProperty(state)) {
      if (stateManager[state].hasOwnProperty("onBothHandsDown")) {
        stateManager[state].onBothHandsDown();
      }
    }
  }

  function onOneHandUp() {
    Diagnostics.log("SIGNAL: oneHandUp");

    if (stateManager.hasOwnProperty(state)) {
      if (stateManager[state].hasOwnProperty("onOneHandUp")) {
        stateManager[state].onOneHandUp();
      }
    }
  }

  function onBothHandsLeft() {
    Diagnostics.log("SIGNAL: bothHandsLeft");

    if (stateManager.hasOwnProperty(state)) {
      if (stateManager[state].hasOwnProperty("onBothHandsLeft")) {
        stateManager[state].onBothHandsLeft();
      }
    }
  }

  function onBothHandsRight() {
    Diagnostics.log("SIGNAL: bothHandsRight");

    if (stateManager.hasOwnProperty(state)) {
      if (stateManager[state].hasOwnProperty("onBothHandsRight")) {
        stateManager[state].onBothHandsRight();
      }
    }
  }

  function onWatermelonAnimatedIn() {
    Diagnostics.log("SIGNAL: watermelonAnimatedIn");

    if (stateManager.hasOwnProperty(state)) {
      if (stateManager[state].hasOwnProperty("onWatermelonAnimatedIn")) {
        stateManager[state].onWatermelonAnimatedIn();
      }
    }
  }

  function onWatermelonCut() {
    Diagnostics.log("SIGNAL: watermelonCut");

    if (stateManager.hasOwnProperty(state)) {
      if (stateManager[state].hasOwnProperty("onWatermelonCut")) {
        stateManager[state].onWatermelonCut();
      }
    }
  }

  // Attach signal handlers
  bothHandsUp.subscribe(onBothHandsUp);
  bothHandsDown.subscribe(onBothHandsDown);
  oneHandUp.subscribe(onOneHandUp);
  bothHandsLeft.subscribe(onBothHandsLeft);
  bothHandsRight.subscribe(onBothHandsRight);
  watermelonAnimatedIn.subscribe(onWatermelonAnimatedIn);
  watermelonCut.subscribe(onWatermelonCut);
})();
