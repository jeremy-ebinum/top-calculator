const operationsElem = document.querySelector(".js-operations");
const currentDisplayElem = document.querySelector(".js-current-display");
const historyDisplayElem = document.querySelector(".js-history-display");

const calculator = {
  history: "",
  queuedCmd: "",
  queuedOperator: "",
  currentDisp: "0",
  currentResult: "",
  isCleared: true,
  hasFloat: false,
  hasQueuedOp: false,
  isCalculating: false,
  isDisplayingResult: false,

  // TODO: Properly handle floating point numbers, general exception handling
  operations: {
    "+": function(a, b) {
      return a + b;
    },
    "-": function(a, b) {
      return a - b;
    },
    "×": function(a, b) {
      return a * b;
    },
    "÷": function(a, b) {
      if (b === 0) return 0;
      return a / b;
      // TODO: Disply Divide by Zero Error
    }
  },

  operate: function(calculation) {
    let expressionArr = calculation.split(" ");
    let firstOperand = parseInt(expressionArr[0]);
    let operator = expressionArr[1];
    let secondOperand = parseInt(expressionArr[2]);

    return this.operations[operator](firstOperand, secondOperand).toString();
  }
};

const handlers = {
  // Handle inputs 0 - 9, If we have an operator queued, prepare for calculation
  inputOperand: function(target) {
    const operand = target.dataset.num;
    if (calculator.isCleared && operand === "0") return;

    if (calculator.hasQueuedOp) calculator.isCalculating = true;

    if (calculator.isCleared) {
      calculator.currentDisp = operand;
      calculator.isCleared = false;
    } else {
      calculator.currentDisp += operand;
    }

    view.updateView();
  },

  // Handle ± and . (Positive/Negative Toggle and decimal point)
  modifyOperand: function(target) {
    if (calculator.isDisplayingResult) return;
    const mod = target.dataset.mod;
    const currentDispIsNegative = calculator.currentDisp.startsWith("-");

    if (calculator.isCleared && mod == "+-") return;
    if (!calculator.isCleared && !currentDispIsNegative && mod == "+-") {
      calculator.currentDisp = "-" + calculator.currentDisp;
    }
    if (!calculator.isCleared && currentDispIsNegative && mod == "+-") {
      calculator.currentDisp = calculator.currentDisp.substring(1);
    }
    if (!calculator.hasFloat && mod == ".") {
      calculator.currentDisp += ".";
      calculator.hasFloat = true;
      calculator.isCleared = false;
    }

    view.updateView();
  },

  clear: function() {
    calculator.history = "";
    calculator.currentDisp = "0";
    calculator.currentResult = "";
    calculator.queuedCmd = "";
    calculator.isCleared = true;
    view.updateView();
  },

  // Only Clear Current Entry
  clearEntry: function() {
    calculator.currentDisp = "0";
    calculator.isCleared = true;
    view.updateView();
  },

  // Delete a character from current Disply/Entry
  backspaceEntry: function() {
    if (calculator.isDisplayingResult) {
      return;
    }
    if (calculator.currentDisp.length === 1) {
      calculator.currentDisp = "0";
    } else {
      calculator.currentDisp = calculator.currentDisp.substring(
        0,
        calculator.currentDisp.length - 1
      );
    }

    view.updateView();
  },

  // Determine calculation to peform based on if we have a previous result
  determineCalc: function() {
    let calculation;

    if (calculator.currentResult.length == 0) {
      calculation = calculator.queuedCmd + " " + calculator.currentDisp;
    } else {
      calculation =
        calculator.currentResult +
        ` ${calculator.queuedOperator} ` +
        calculator.currentDisp;
    }

    return calculation;
  },

  /*
    Make sure to preserve calculator history and store queued commands
    We only want results when 2 operands are available to operate on
  */
  performOperation: function(operator) {
    if (calculator.isCalculating) {
      calculator.currentResult = calculator.operate(this.determineCalc());
      calculator.history =
        calculator.queuedCmd + " " + calculator.currentDisp + ` ${operator}`;
      calculator.queuedCmd = calculator.history;
      calculator.isCalculating = false;
    } else {
      if (calculator.queuedCmd.length > 0) {
        calculator.history = calculator.queuedCmd.slice(0, -2) + ` ${operator}`;
      } else {
        calculator.history = calculator.currentDisp + ` ${operator}`;
      }
      calculator.queuedCmd = calculator.history;
    }

    calculator.queuedOperator = calculator.history.charAt(
      calculator.history.length - 1
    );
  },

  // When the operator is the equal sign we only want the current result
  queueOperation: function(target) {
    const operator = target.dataset.op;
    if (operator == "=") {
      this.performOperation(calculator.queuedOperator);
      calculator.history = "";
      calculator.queuedCmd = "";
      calculator.hasQueuedOp = false;
    } else {
      this.performOperation(operator);
      calculator.hasQueuedOp = true;
    }

    if (calculator.currentResult.length > 0) {
      calculator.currentDisp = calculator.currentResult;
      calculator.isDisplayingResult = true;
    } else {
      calculator.currentDisp = "0";
    }

    calculator.isCleared = true;
    view.updateView();
  }
};

// Handle DOM Manipulation
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
          break;
        case "operator":
          handlers.queueOperation(e.target);
          break;
      }
    };
  },

  updateView: function() {
    historyDisplayElem.textContent = calculator.history;
    currentDisplayElem.textContent = calculator.currentDisp;
  }

  // TODO: Add Alert/Error service

  // TODO: Alter Top Display When Inputs are longer than the container
};

// Start the calculator app
function init() {
  view.updateView();
  view.setupEventListeners();
}

document.addEventListener("DOMContentLoaded", init);
