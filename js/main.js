const operationsElem = document.querySelector(".js-operations");
const currentDisplayElem = document.querySelector(".js-current-display");
const oldDisplayElem = document.querySelector(".js-old-display");

const calculator = {
  oldCmd: "",
  currentCmd: "0",
  isCleared: true,
  hasFloat: false,
  hasQueuedOp: false,

  operations: {
    "+": function(a, b) {
      return a + b;
    },
    "-": function(a, b) {
      return a - b;
    },
    "*": function(a, b) {
      return a * b;
    },
    "/": function(a, b) {
      if (b === 0) return null;
      return a / b;
    }
  },

  operate: function(inputStr) {}
};

const handlers = {
  inputOperand: function(target) {
    const operand = target.dataset.num;

    if (calculator.isCleared && operand === "0") return;

    if (calculator.isCleared) {
      calculator.currentCmd = operand;
      calculator.isCleared = false;
    } else {
      calculator.currentCmd += operand;
    }

    view.updateView();
  },

  modifyOperand: function(target) {
    const mod = target.dataset.mod;
    const currentCmdIsNegative = calculator.currentCmd.startsWith("-");

    if (calculator.isCleared && mod == "+-") return;
    if (!calculator.isCleared && !currentCmdIsNegative && mod == "+-") {
      calculator.currentCmd = "-" + calculator.currentCmd;
    }
    if (!calculator.isCleared && currentCmdIsNegative && mod == "+-") {
      calculator.currentCmd = calculator.currentCmd.substring(1);
    }
    if (!calculator.hasFloat && mod == ".") {
      calculator.currentCmd += ".";
      calculator.hasFloat = true;
      calculator.isCleared = false;
    }

    view.updateView();
  },

  clear: function() {
    calculator.oldCmd = "";
    calculator.currentCmd = "0";
    calculator.isCleared = true;
    view.updateView();
  },

  clearEntry: function() {
    calculator.currentCmd = "0";
    calculator.isCleared = true;
    view.updateView();
  },

  backspaceEntry: function() {
    if (calculator.currentCmd.length === 1) {
      calculator.currentCmd = "0";
    } else {
      calculator.currentCmd = calculator.currentCmd.substring(
        0,
        calculator.currentCmd.length - 1
      );
    }

    view.updateView();
  },

  queueOperation: function() {}
};

const view = {
  setupEventListeners: function() {
    operationsElem.onclick = function(e) {
      switch (e.target.dataset.cmd) {
        case "operand":
          handlers.inputOperand(e.target);
          break;
        case "operand-mod":
          handlers.modifyOperand(e.target);
          break;
        case "C":
          handlers.clear();
          break;
        case "CE":
          handlers.clearEntry();
          break;
        case "backspace":
          handlers.backspaceEntry();
        case "operator":
          handlers.queueOperation();
          break;
      }
    };
  },

  updateView: function() {
    oldDisplayElem.textContent = calculator.oldCmd;
    currentDisplayElem.textContent = calculator.currentCmd;
  }
};

function init() {
  view.updateView();
  view.setupEventListeners();
}

document.addEventListener("DOMContentLoaded", init);
