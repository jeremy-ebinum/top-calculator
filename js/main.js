const operationsElem = document.querySelector(".js-operations");
const currentDisplayElem = document.querySelector(".js-current-display");
const historyDisplayElem = document.querySelector(".js-history-display");
const currentDisplayTxtElem = document.querySelector(".js-current-display-txt");
const historyDisplayTxtElem = document.querySelector(".js-history-display-txt");

const calculator = {
  history: "",
  queuedCmd: "",
  queuedOperator: "",
  lastOperator: "",
  currentCmd: "0",
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
      calculator.currentCmd = operand;
      calculator.isCleared = false;
    } else {
      calculator.currentCmd += operand;
    }

    calculator.isDisplayingResult = false;
    view.updateView();
  },

  // Handle ± and . (Positive/Negative Toggle and decimal point)
  modifyOperand: function(target) {
    if (calculator.isDisplayingResult) return;
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
    calculator.history = "";
    calculator.currentCmd = "0";
    calculator.currentResult = "";
    calculator.queuedCmd = "";
    calculator.queuedOperator = "";
    calculator.lastOperator = "";
    calculator.hasQueuedOp = false;
    calculator.isCleared = true;
    view.updateView();
  },

  // Only Clear Current Entry
  clearEntry: function() {
    calculator.currentCmd = "0";
    calculator.isCleared = true;
    view.updateView();
  },

  // Delete a character from current command
  backspaceEntry: function() {
    if (calculator.isDisplayingResult) {
      return;
    }
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

  // Determine calculation to peform based on if we have a previous result
  determineCalc: function() {
    let calculation;

    if (calculator.currentResult.length == 0) {
      calculation = calculator.queuedCmd + " " + calculator.currentCmd;
    } else {
      calculation =
        calculator.currentResult +
        ` ${calculator.queuedOperator} ` +
        calculator.currentCmd;
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
        calculator.queuedCmd + " " + calculator.currentCmd + ` ${operator}`;
      calculator.queuedCmd = calculator.history;
      calculator.isCalculating = false;
    } else {
      if (calculator.queuedCmd.length > 0) {
        calculator.history = calculator.queuedCmd.slice(0, -2) + ` ${operator}`;
      } else {
        calculator.history = calculator.currentCmd + ` ${operator}`;
      }
      calculator.queuedCmd = calculator.history;
    }

    calculator.queuedOperator = calculator.history.charAt(
      calculator.history.length - 1
    );

    calculator.lastOperator = operator;
  },

  handleRepeatedEquals: function() {
    if (calculator.lastOperator != "=") return;
    let repeatOperand = calculator.queuedCmd.substr(
      calculator.queuedCmd.length - 3,
      1
    );
    calculator.isCalculating = true;
    calculator.currentResult = calculator.currentCmd;
    calculator.currentCmd = repeatOperand;
  },

  /*
    Only perform = computation when there is a queuedCmd
    Display only the current Result on Equals operation
  */
  queueOperation: function(target) {
    const operator = target.dataset.op;
    if (calculator.queuedCmd.length == 0) {
      calculator.isCalculating = false;
    }
    if (operator == "=" && calculator.queuedCmd.length > 0) {
      this.handleRepeatedEquals();
      this.performOperation(calculator.queuedOperator);
      calculator.history = "";
      calculator.lastOperator = "=";
    }
    if (operator != "=") {
      this.performOperation(operator);
    }

    if (calculator.currentResult.length > 0) {
      calculator.currentCmd = calculator.currentResult;
      calculator.isDisplayingResult = true;
    } else {
      calculator.currentCmd = "0";
    }

    calculator.hasQueuedOp = true;
    calculator.isCleared = true;
    view.updateView();
  }
};

// Handle DOM Manipulation
const view = {
  maxHistoryDisplayTxtW: 0,
  maxCurrentDisplaYTxtW: 0,

  setupEventListeners: function() {
    operationsElem.onclick = function(e) {
      e.preventDefault();
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

  handleHistoryDisplayOverflow: function() {
    console.log("TIME TO CAROUSEL HISTORY!");
  },

  handleCurrentDisplayOverflow: function() {
    console.log("TIME TO CAROUSEL CURRENT!");
  },

  handleDisplayOverflow: function() {
    const historyTxtWLimit =
      historyDisplayElem.offsetWidth -
      parseInt(getComputedStyle(historyDisplayTxtElem)["fontSize"]) -
      parseInt(getComputedStyle(historyDisplayTxtElem)["letterSpacing"]);
    const currentTxtWLimit =
      currentDisplayElem.offsetWidth -
      parseInt(getComputedStyle(currentDisplayTxtElem)["fontSize"]) -
      parseInt(getComputedStyle(currentDisplayTxtElem)["letterSpacing"]);

    if (historyDisplayTxtElem.offsetWidth > this.maxHistoryDisplayTxtW) {
      this.maxHistoryDisplayTxtW = historyDisplayTxtElem.offsetWidth;
    }
    if (currentDisplayTxtElem.offsetWidth > this.maxCurrentDisplaYTxtW) {
      this.maxCurrentDisplaYTxtW = currentDisplayTxtElem.offsetWidth;
    }

    if (this.maxHistoryDisplayTxtW >= historyTxtWLimit) {
      this.handleHistoryDisplayOverflow();
    }
    if (this.maxCurrentDisplaYTxtW >= currentTxtWLimit) {
      this.handleCurrentDisplayOverflow();
    }
  },

  updateView: function() {
    historyDisplayTxtElem.textContent = calculator.history;
    currentDisplayTxtElem.textContent = calculator.currentCmd;

    this.handleDisplayOverflow();
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
