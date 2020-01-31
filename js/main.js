const operationsElem = document.querySelector(".js-operations");
const currentDisplayElem = document.querySelector(".js-current-display");
const historyDisplayElem = document.querySelector(".js-history-display");
const currentDisplayTxtElem = document.querySelector(".js-current-display-txt");
const historyDisplayTxtElem = document.querySelector(".js-history-display-txt");
const historyScrollLeftElem = document.querySelector(".js-history-scroll-l");
const currentScrollLeftElem = document.querySelector(".js-current-scroll-l");
const historyScrollRightElem = document.querySelector(".js-history-scroll-r");
const currentScrollRightElem = document.querySelector(".js-current-scroll-r");

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

// Bridge View and Calculator
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
    calculator.hasFloat = false;
    calculator.hasQueuedOp = false;
    calculator.isCleared = true;
    view.updateView();
  },

  // Only Clear Current Entry
  clearEntry: function() {
    calculator.currentCmd = "0";
    calculator.hasFloat = false;
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
  historyTxtWLimit: 0,
  currentTxtWLimit: 0,
  historyDisplayIsOverflown: false,
  currentDisplayIsOverflown: false,

  setupOperationsElemClickListener: function() {
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

  /**
   * Animate an element's right position/property using jQuery
   *
   * @param {HTMLElement} elem Element to be animated
   * @param {string} changeStr jQuery Property Modifier String
   * @param {number} speed Speed in ms
   */
  animateElemRightPosition(elem, changeStr, speed) {
    $(elem).animate(
      {
        right: changeStr
      },
      speed
    );
  },

  scrollHistoryDisplayLeft: function(e) {
    const historyTxtRelLft = parseInt($(historyDisplayTxtElem).position().left);

    if (historyTxtRelLft > 0) return;

    const fontSize = parseInt($(historyDisplayTxtElem).css("fontSize"));
    const ltrSpacing = parseInt($(historyDisplayTxtElem).css("letterSpacing"));
    const scrollAmt = fontSize + ltrSpacing;

    if (historyTxtRelLft + scrollAmt > 0) {
      view.animateElemRightPosition(
        historyDisplayTxtElem,
        `-=${-historyTxtRelLft + ltrSpacing}`,
        100
      );
    } else {
      view.animateElemRightPosition(
        historyDisplayTxtElem,
        `-=${scrollAmt}`,
        100
      );
    }

    view.updateHistoryScrolRightElemVisibility();
  },

  scrollCurrentDisplayLeft: function(e) {
    const currentTxtRelLft = parseInt($(currentDisplayTxtElem).position().left);

    if (currentTxtRelLft > 0) return;

    const fontSize = parseInt($(currentDisplayTxtElem).css("fontSize"));
    const ltrSpacing = parseInt($(currentDisplayTxtElem).css("letterSpacing"));
    const scrollAmt = fontSize + ltrSpacing;

    if (currentTxtRelLft + scrollAmt > 0) {
      view.animateElemRightPosition(
        currentDisplayTxtElem,
        `-=${-currentTxtRelLft + ltrSpacing}`,
        100
      );
    } else {
      view.animateElemRightPosition(
        currentDisplayTxtElem,
        `-=${scrollAmt}`,
        100
      );
    }

    view.updateCurrentScrolRightElemVisibility();
  },

  scrollHistoryDisplayRight: function(e) {
    const historyTxtCssRight = parseInt($(historyDisplayTxtElem).css("right"));

    if (historyTxtCssRight >= 0) return;

    const fontSize = parseInt($(historyDisplayTxtElem).css("fontSize"));
    const ltrSpacing = parseInt($(historyDisplayTxtElem).css("letterSpacing"));
    const scrollAmt = fontSize + ltrSpacing;

    if (historyTxtCssRight + scrollAmt > 0) {
      view.animateElemRightPosition(historyDisplayTxtElem, `0`, 100);
    } else {
      view.animateElemRightPosition(
        historyDisplayTxtElem,
        `+=${scrollAmt}`,
        100
      );
    }

    view.updateHistoryScollLeftElemVisibility();
  },

  scrollCurrentDisplayRight: function(e) {
    const currentTxtCssRight = parseInt($(currentDisplayTxtElem).css("right"));

    if (currentTxtCssRight >= 0) return;

    const fontSize = parseInt($(currentDisplayTxtElem).css("fontSize"));
    const ltrSpacing = parseInt($(currentDisplayTxtElem).css("letterSpacing"));
    const scrollAmt = fontSize + ltrSpacing;

    if (currentTxtCssRight + scrollAmt > 0) {
      view.animateElemRightPosition(currentDisplayTxtElem, `0`, 100);
    } else {
      view.animateElemRightPosition(
        currentDisplayTxtElem,
        `+=${scrollAmt}`,
        100
      );
    }

    view.updateCurrentScrollLeftElemVisibility();
  },

  setupScrollElemsClickListeners: function() {
    historyScrollLeftElem.onclick = view.scrollHistoryDisplayLeft;
    currentScrollLeftElem.onclick = view.scrollCurrentDisplayLeft;
    historyScrollRightElem.onclick = view.scrollHistoryDisplayRight;
    currentScrollRightElem.onclick = view.scrollCurrentDisplayRight;
  },

  handleDigitButtonPresses: function(e) {
    const digitRegex = /(Digit|Numpad)([0-9])/;
    if (digitRegex.test(e.code)) {
      $(`[data-num=${e.code.match(digitRegex)[2]}]`).click();
    } else return;
  },

  handleOperatorButtonPresses: function(e) {
    if (
      e.key === "+" ||
      e.code === "NumpadAdd" ||
      (e.code === "Equal" && e.shiftKey)
    ) {
      $(`[data-op="+"]`).click();
    }
    if (
      (e.code === "Minus" && !e.shiftKey) ||
      (e.code === "NumpadSubtract" && !e.shiftKey)
    ) {
      $(`[data-op="-"]`).click();
    }
    if (e.code === "Equal" || e.code === "Enter") {
      $(`[data-op="="]`).click();
    }
    if (e.code === "KeyX" || e.code === "NumpadMultiply") {
      $(`[data-op="×"]`).click();
    }
    if (e.code === "Slash" || e.code === "NumpadDivide") {
      $(`[data-op="÷"]`).click();
    }

    return;
  },

  handleModifierButtonPresses: function(e) {
    if (e.code === "Backspace" && !e.shiftKey) {
      $(`[data-cmd=backspace]`).click();
    }
    if (
      (e.code === "Minus" && e.shiftKey) ||
      (e.code === "NumpadSubtract" && e.shiftKey)
    ) {
      $(`[data-mod="+-"]`).click();
    }
    if (e.code === "Period" || e.code === "NumpadDecimal") {
      $(`[data-mod="."]`).click();
    }

    return;
  },

  handleClearButtonPresses: function(e) {
    if (e.code === "Backspace" && e.shiftKey && !e.ctrlKey) {
      $(`[data-cmd="CE"]`).click();
    }

    if (e.code === "Backspace" && e.shiftKey && e.ctrlKey) {
      $(`[data-cmd="C"]`).click();
    }
    return;
  },

  handleScrollButtonPresses: function(e) {
    if (!view.currentDisplayIsOverflown && !view.historyDisplayIsOverflown) {
      return;
    }

    if (view.currentDisplayIsOverflown) {
      if (e.code == "ArrowRight") {
        $(`.js-current-scroll-r`).click();
      }
      if (e.code == "ArrowLeft") {
        $(`.js-current-scroll-l`).click();
      }
    }
    if (view.historyDisplayIsOverflown) {
      if (e.code == "ArrowDown") {
        $(`.js-history-scroll-r`).click();
      }
      if (e.code == "ArrowUp") {
        $(`.js-history-scroll-l`).click();
      }
    }

    return;
  },

  setupKeyDownListener: function() {
    window.addEventListener("keydown", function(e) {
      view.handleScrollButtonPresses(e);
      view.handleDigitButtonPresses(e);
      view.handleOperatorButtonPresses(e);
      view.handleModifierButtonPresses(e);
      view.handleClearButtonPresses(e);
    });
  },

  setupEventListeners: function() {
    this.setupOperationsElemClickListener();
    this.setupScrollElemsClickListeners();
    this.setupKeyDownListener();
  },

  updateDisplayWLimits: function() {
    this.historyTxtWLimit = historyDisplayElem.offsetWidth + window.pageXOffset;
    this.currentTxtWLimit = currentDisplayElem.offsetWidth + window.pageXOffset;

    this.maxHistoryDisplayTxtW =
      historyDisplayTxtElem.offsetWidth + window.pageXOffset;
    this.maxCurrentDisplaYTxtW =
      currentDisplayTxtElem.offsetWidth + window.pageXOffset;
  },

  updateHistoryScollLeftElemVisibility: function() {
    if (!this.historyDisplayIsOverflown) {
      if ($(".js-history-scroll-l").is(":visible")) {
        $(".js-history-scroll-l").fadeOut("fast");
      }
      return;
    }
    $(".js-history-scroll-l").fadeIn("fast");
  },

  updateCurrentScrollLeftElemVisibility: function() {
    if (!this.currentDisplayIsOverflown) {
      if ($(".js-current-scroll-l").is(":visible")) {
        $(".js-current-scroll-l").fadeOut("fast");
      }
      return;
    }
    $(".js-current-scroll-l").fadeIn("fast");
  },

  updateHistoryScrolRightElemVisibility: function() {
    if (view.historyDisplayIsOverflown) {
      $(".js-history-scroll-r").fadeIn("fast");
    } else {
      if ($(".js-history-scroll-r").is(":visible")) {
        $(".js-history-scroll-r").fadeOut("fast");
      }
    }
  },

  updateCurrentScrolRightElemVisibility: function() {
    if (view.currentDisplayIsOverflown) {
      $(".js-current-scroll-r").fadeIn("fast");
    } else {
      if ($(".js-current-scroll-r").is(":visible")) {
        $(".js-current-scroll-r").fadeOut("fast");
      }
    }
  },

  handleDisplayOverflow: function() {
    this.updateDisplayWLimits();

    if (this.maxHistoryDisplayTxtW > this.historyTxtWLimit) {
      this.historyDisplayIsOverflown = true;
    } else {
      this.historyDisplayIsOverflown = false;
    }
    if (this.maxCurrentDisplaYTxtW > this.currentTxtWLimit) {
      this.currentDisplayIsOverflown = true;
    } else {
      this.currentDisplayIsOverflown = false;
    }

    this.updateHistoryScollLeftElemVisibility();
    this.updateCurrentScrollLeftElemVisibility();
    this.updateHistoryScrolRightElemVisibility();
    this.updateCurrentScrolRightElemVisibility();
  },

  scrollDisplayToTheEnd: function() {
    document.querySelectorAll("[class*='display-txt']").forEach(disp => {
      $(disp).animate(
        {
          right: "0"
        },
        100
      );
    });
  },

  updateView: function() {
    historyDisplayTxtElem.textContent = calculator.history;
    currentDisplayTxtElem.textContent = calculator.currentCmd;

    this.scrollDisplayToTheEnd();
    this.handleDisplayOverflow();
  }

  // TODO: Add Alert/Error service
};

// Start the calculator app
function init() {
  view.updateView();
  view.setupEventListeners();
}

document.addEventListener("DOMContentLoaded", init);
