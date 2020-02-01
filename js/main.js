const operationsElem = document.querySelector(".js-operations");
const currentDisplayElem = document.querySelector(".js-current-display");
const historyDisplayElem = document.querySelector(".js-history-display");
const currentDisplayTxtElem = document.querySelector(".js-current-display-txt");
const historyDisplayTxtElem = document.querySelector(".js-history-display-txt");
const historyScrollLeftElem = document.querySelector(".js-history-scroll-l");
const currentScrollLeftElem = document.querySelector(".js-current-scroll-l");
const historyScrollRightElem = document.querySelector(".js-history-scroll-r");
const currentScrollRightElem = document.querySelector(".js-current-scroll-r");
const bodyStyle = document.body.style;

const calculator = {
  history: "",
  queuedOp: "",
  queuedOperator: "",
  latestOperator: "",
  repeatOperator: null,
  currentCmd: "0",
  repeatCmd: null,
  lastCmd: null,
  currentResult: "",
  lastResult: "",
  decimalLimit: 2,
  isCleared: true,
  hasFloat: false,
  hasQueuedOp: false,
  isCalculating: false,
  isDisplayingResult: false,

  generateIntOrFloatResult: function(result) {
    if (Number.isInteger(result)) {
      return result;
    } else {
      return result.toFixed(calculator.decimalLimit);
    }
  },

  operations: {
    "+": function(a, b) {
      let result = a + b;
      return calculator.generateIntOrFloatResult(result);
    },
    "-": function(a, b) {
      let result = a - b;
      return calculator.generateIntOrFloatResult(result);
    },
    "×": function(a, b) {
      let result = a * b;
      return calculator.generateIntOrFloatResult(result);
    },
    "÷": function(a, b) {
      if (b === 0) {
        view.displayAlert("error", "You cannot divide by zero");
        handlers.clear();
        return 0;
      }
      let result = a / b;
      return calculator.generateIntOrFloatResult(result);
    },

    "√": function(a) {
      let result = Math.sqrt(a);
      return calculator.generateIntOrFloatResult(result);
    }
  },

  operate: function(calculation) {
    let expressionArr = calculation.split(" ");
    let singleOperand, firstOperand, secondOperand, operator;
    if (expressionArr.length > 2) {
      firstOperand = parseFloat(expressionArr[0]);
      operator = expressionArr[1];
      secondOperand = parseFloat(expressionArr[2]);

      return this.operations[operator](firstOperand, secondOperand).toString();
    } else {
      singleOperand = parseFloat(expressionArr[1]);
      operator = expressionArr[0];

      return this.operations[operator](singleOperand).toString();
    }
  }
};

// Bridge View and Calculator
const handlers = {
  // Handle inputs 0 - 9, If we have an operator queued, prepare for calculation
  inputOperand: function(target) {
    const operand = target.dataset.num;
    if (calculator.hasQueuedOp) calculator.isCalculating = true;

    if (calculator.isCleared && operand === "0") {
      calculator.currentCmd = "0";
    }

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

    if (calculator.isCleared && (mod == "+-" || mod == "%")) return;
    if (!calculator.isCleared && mod == "%") {
      let currentCmdInt = parseInt(calculator.currentCmd);
      calculator.currentCmd = (currentCmdInt / 100).toString();
    }
    if (!calculator.isCleared && !currentCmdIsNegative && mod == "+-") {
      calculator.currentCmd = "-" + calculator.currentCmd;
    }
    if (!calculator.isCleared && currentCmdIsNegative && mod == "+-") {
      calculator.currentCmd = calculator.currentCmd.substring(1);
    }
    if (mod == "." && !calculator.hasFloat) {
      calculator.currentCmd += ".";
      calculator.hasFloat = true;
      calculator.isCleared = false;
    }

    view.updateView();
  },

  clear: function() {
    calculator.history = "";
    calculator.queuedOp = "";
    calculator.queuedOperator = "";
    calculator.latestOperator = "";
    calculator.repeatOperator = null;
    calculator.currentCmd = "0";
    calculator.repeatCmd = null;
    calculator.lastCmd = null;
    calculator.currentResult = "";
    calculator.lastResult = "";
    calculator.hasFloat = false;
    calculator.hasQueuedOp = false;
    calculator.isCalculating = false;
    calculator.isDisplayingResult = false;
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

  determineCalcForRepeatEquals: function() {
    let calculation;

    if (calculator.repeatOperator == "√") {
      calculation = `√ ${calculator.currentResult}`;
    } else {
      calculation =
        calculator.currentResult +
        ` ${calculator.repeatOperator} ` +
        calculator.repeatCmd;
    }

    return calculation;
  },

  determineCalcForRepeatOps() {
    let calculation;

    if (calculator.latestOperator == "=") {
      calculation = this.determineCalcForRepeatEquals();
    } else if (calculator.latestOperator == "√") {
      calculation = `${calculator.queuedOperator} ${calculator.currentResult}`;
    } else {
      calculation =
        calculator.currentResult +
        ` ${calculator.queuedOperator} ` +
        calculator.currentCmd;
    }

    return calculation;
  },

  determineCalcForOneOffSqrt: function() {
    let calculation;

    if (calculator.queuedOperator == "=") {
      calculation = `√ ${calculator.currentCmd}`;
    } else {
      calculator.currentResult = calculator.lastResult || calculator.lastCmd;
      calculator.currentCmd = calculator.operate(`√ ${calculator.currentCmd}`);
      calculation =
        calculator.currentResult +
        ` ${calculator.queuedOperator} ` +
        calculator.currentCmd;
    }

    return calculation;
  },

  determineCalcForOneOffOps() {
    let calculation;

    // TODO: Hook intermediary operations
    if (calculator.latestOperator == "√") {
      calculation = this.determineCalcForOneOffSqrt();
    } else {
      calculation =
        calculator.currentResult +
        ` ${calculator.queuedOperator} ` +
        calculator.currentCmd;
    }

    return calculation;
  },
  // Determine calculation to peform based on if we have a previous result
  determineCalc: function() {
    let calculation;

    if (calculator.currentResult.length == 0) {
      calculation = calculator.queuedOp + " " + calculator.currentCmd;
    } else {
      if (calculator.queuedOperator == calculator.latestOperator) {
        // TODO: This is for repeated operations
        calculation = this.determineCalcForRepeatOps();
      } else {
        // TODO: This is for one off operations
        calculation = this.determineCalcForOneOffOps();
      }
    }

    return calculation;
  },

  updateHistoryWhileNotCalculating: function(operator) {
    if (calculator.queuedOp.length > 0) {
      // Make sure history shows the chain of commands and the latest operator
      if (
        calculator.latestOperator == "√" ||
        calculator.queuedOperator == "√"
      ) {
        calculator.history = calculator.queuedOp + " " + ` ${operator}`;
      } else {
        calculator.history = calculator.queuedOp.slice(0, -2) + ` ${operator}`;
      }
    } else {
      // For first time inputs just add the operator to front of history
      calculator.history = calculator.currentCmd + ` ${operator}`;
    }
  },

  updateCalcHistoryForEquals() {
    if (calculator.queuedOperator != "=") {
      calculator.repeatOperator = calculator.queuedOperator;
      debug.logCmdsAndQueuedOp();
      calculator.repeatCmd = calculator.currentCmd;
    }

    if (calculator.repeatOperator == "√") {
      calculator.history = calculator.queuedOp;
    } else {
      calculator.history =
        calculator.queuedOp +
        " " +
        calculator.repeatCmd +
        ` ${calculator.repeatOperator}`;
    }
  },

  updateCalcHistoryForSqrt(operator) {
    if (operator == "√" || calculator.queuedOperator == "√") {
      if (!calculator.hasQueuedOp) {
        calculator.history = calculator.queuedOp + " " + calculator.currentCmd;
      } else if (calculator.hasQueuedOp && calculator.queuedOperator !== "√") {
        calculator.history = calculator.queuedOp;
      } else {
        calculator.history = calculator.queuedOp + " " + calculator.currentCmd;
      }
    }
  },

  determineCalcAndUpdateHistory: function(operator) {
    calculator.currentResult = calculator.operate(this.determineCalc());
    calculator.lastResult = calculator.currentResult;
    debug.logOperators();

    if (operator == "=") {
      this.updateCalcHistoryForEquals(operator);
    } else if (operator == "√") {
      this.updateCalcHistoryForSqrt(operator);
    } else {
      calculator.history =
        calculator.queuedOp + " " + calculator.currentCmd + ` ${operator}`;
    }

    calculator.queuedOp = calculator.history;
    calculator.hasFloat = false;
    calculator.isCalculating = false;
  },

  /*
    Make sure to preserve calculator history and store queued commands
    We only want results when 2 operands are available to operate on
  */
  //  TODO: Handle 1/x and x²
  performOperation: function(operator) {
    calculator.latestOperator = operator;

    if (calculator.isCalculating) {
      this.determineCalcAndUpdateHistory(operator);
    } else {
      this.updateHistoryWhileNotCalculating(operator);
      calculator.queuedOp = calculator.history;
    }

    calculator.queuedOperator = operator;
    calculator.lastCmd = calculator.currentCmd;
  },

  setupRepeatedEquals: function() {
    if (!calculator.repeatOperator) {
      calculator.repeatOperator = calculator.queuedOperator;
    }

    if (!calculator.repeatCmd) {
      calculator.repeatCmd = calculator.lastCmd;
    }
    calculator.isCalculating = true;
  },

  setupSquareRoots: function() {
    if (!calculator.hasQueuedOp || calculator.latestOperator == "√") {
      calculator.isCalculating = true;
      calculator.queuedOp = "√";
    }

    if (calculator.hasQueuedOp) {
      calculator.isCalculating = true;
      calculator.currentResult = calculator.currentCmd;
      if (calculator.latestOperator !== "√") {
        calculator.queuedOp += ` √ ${calculator.currentCmd}`;
      }
    }
  },
  /*
    Only perform = computation when there is a queuedOp
    Display only the current Result on Equals operation
  */
  queueOperation: function(target) {
    const operator = target.dataset.op;
    if (operator == "1/" || operator == "^2") {
      view.displayAlert("info", "Operation not yet implemented");
      return;
    }

    if (calculator.queuedOp.length == 0) {
      calculator.isCalculating = false;
    }
    if (operator == "√") {
      this.setupSquareRoots();
    }
    if (operator == "=") {
      if (calculator.queuedOp.length > 0) {
        this.setupRepeatedEquals();
        this.performOperation(operator);
        calculator.history = "";
      } else {
        view.displayAlert("error", "There are no operands to calculate");
      }
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
      if (e.code === "Enter") e.preventDefault();
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

  createAlert(type, message) {
    const alertTypes = {
      error: "c-alert--error",
      info: "c-alert--info"
    };

    if (!alertTypes[type]) return;

    const alert = $("<div>", {
      class: `c-alert ${alertTypes[type]} c-alert--is-hidden`
    });
    const msg = $("<span>", { class: `c-alert__txt` });
    msg.text(message);
    alert.append(msg);

    return alert;
  },

  dismissModalOnOuterClick(e) {
    const type = e.target.dataset.modalType;

    if (!type) {
      window.removeEventListener("click", view.dismissModalOnOuterClick);
      return;
    }

    const dismissClasses = {
      help: ".js-dismiss-help"
    };

    $(dismissClasses[type]).click();
    window.removeEventListener("click", view.dismissModalOnOuterClick);
  },

  displayAlert(type, message, autoCloseTime = 3000) {
    const alert = view.createAlert(type, message);
    $(".js-container").append(alert);
    $(alert).slideDown(300, function() {
      setTimeout(() => {
        $(this).slideUp(200);
      }, autoCloseTime);
    });
  },

  openHelpModal: function() {
    $(".js-help-modal")
      .removeClass("c-help-modal--is-hidden")
      .hide()
      .fadeIn(300);
    bodyStyle.overflow = "hidden";

    setTimeout(() => {
      window.addEventListener("click", view.dismissModalOnOuterClick);
    }, 0);
  },

  closeHelpModal: function() {
    $(".js-help-modal").fadeOut(200, () => {
      $(this).addClass("c-help-modal--is-hidden");
    });
    bodyStyle.overflow = "";
  },

  updateView: function() {
    historyDisplayTxtElem.textContent = calculator.history;
    currentDisplayTxtElem.textContent = calculator.currentCmd;

    this.scrollDisplayToTheEnd();
    this.handleDisplayOverflow();
  }
};

const debug = {
  logOperators: function() {
    console.log("Queued Operator is:", calculator.queuedOperator);
    console.log("Latest Operator is:", calculator.latestOperator);
    console.log("Repeat Operator is:", calculator.repeatOperator);
  },

  logCmdsAndQueuedOp: function() {
    console.log("Queued Operation is:", calculator.queuedOp);
    console.log("Current Cmd is:", calculator.currentCmd);
    console.log("Last Cmd is:", calculator.lastCmd);
    console.log("Repeat Cmd is:", calculator.repeatCmd);
  },

  logResults: function() {
    console.log("Last Result is:", calculator.lastResult);
    console.log("Current Result is:", calculator.currentResult);
  }
};

// Start the calculator app
function init() {
  view.updateView();
  view.setupEventListeners();
}

document.addEventListener("DOMContentLoaded", init);
