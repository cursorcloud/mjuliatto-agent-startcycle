// iPhone Style Calculator JavaScript

const calculator = {
  displayValue: '0',
  firstOperand: null,
  waitingForSecondOperand: false,
  operator: null,
};

const performCalculation = {
  divide: (firstOperand, secondOperand) => secondOperand === 0 ? 'Error' : firstOperand / secondOperand,
  multiply: (firstOperand, secondOperand) => firstOperand * secondOperand,
  subtract: (firstOperand, secondOperand) => firstOperand - secondOperand,
  add: (firstOperand, secondOperand) => firstOperand + secondOperand
};

// Update Display and Font Size
function updateDisplay() {
  const display = document.getElementById('calcDisplay');
  display.textContent = calculator.displayValue;

  // Dynamic font size to prevent layout breakage
  const len = calculator.displayValue.length;
  if (len <= 6) {
    display.style.fontSize = '4.5rem';
  } else if (len === 7) {
    display.style.fontSize = '3.8rem';
  } else if (len === 8) {
    display.style.fontSize = '3.3rem';
  } else if (len === 9) {
    display.style.fontSize = '2.9rem';
  } else {
    display.style.fontSize = '2.4rem';
  }

  // Toggle C / AC text
  const clearBtn = document.getElementById('btn-clear');
  if (calculator.displayValue === '0' && calculator.firstOperand === null && calculator.operator === null) {
    clearBtn.textContent = 'AC';
  } else {
    clearBtn.textContent = 'C';
  }
}

// Input Digit
function inputDigit(digit) {
  const { displayValue, waitingForSecondOperand } = calculator;

  clearActiveOperator();

  if (waitingForSecondOperand === true) {
    calculator.displayValue = digit;
    calculator.waitingForSecondOperand = false;
  } else {
    // Avoid double leading zeroes or overflow
    if (displayValue.length >= 9) return;
    calculator.displayValue = displayValue === '0' ? digit : displayValue + digit;
  }
}

// Input Decimal
function inputDecimal() {
  if (calculator.waitingForSecondOperand === true) {
    calculator.displayValue = '0.';
    calculator.waitingForSecondOperand = false;
    return;
  }

  if (!calculator.displayValue.includes('.')) {
    calculator.displayValue += '.';
  }
}

// Toggle Sign (+/-)
function toggleSign() {
  if (calculator.displayValue === 'Error') return;
  calculator.displayValue = (parseFloat(calculator.displayValue) * -1).toString();
}

// Percent (%)
function inputPercent() {
  if (calculator.displayValue === 'Error') return;
  
  const currentValue = parseFloat(calculator.displayValue);
  const result = currentValue / 100;

  // Format to avoid long float representations
  calculator.displayValue = parseFloat(result.toFixed(9)).toString();
  calculator.waitingForSecondOperand = true;
}

// Handle Operator Selection
function handleOperator(nextOperator) {
  const { firstOperand, displayValue, operator } = calculator;
  const inputValue = parseFloat(displayValue);

  if (displayValue === 'Error') return;

  // Highlight the current operator button
  clearActiveOperator();
  const operatorButton = document.querySelector(`[data-operator="${nextOperator}"]`);
  if (operatorButton) {
    operatorButton.classList.add('active-op');
  }

  if (operator && calculator.waitingForSecondOperand)  {
    calculator.operator = nextOperator;
    return;
  }

  if (firstOperand === null && !isNaN(inputValue)) {
    calculator.firstOperand = inputValue;
  } else if (operator) {
    const result = performCalculation[operator](firstOperand, inputValue);

    if (result === 'Error') {
      calculator.displayValue = 'Error';
      resetCalculator();
      updateDisplay();
      return;
    }

    calculator.displayValue = parseFloat(result.toFixed(9)).toString();
    calculator.firstOperand = parseFloat(result.toFixed(9));
  }

  calculator.waitingForSecondOperand = true;
  calculator.operator = nextOperator;
}

// Perform Calculation (=)
function handleCalculate() {
  let { firstOperand, displayValue, operator } = calculator;
  const inputValue = parseFloat(displayValue);

  if (operator === null || calculator.waitingForSecondOperand) {
    return;
  }

  const result = performCalculation[operator](firstOperand, inputValue);

  if (result === 'Error') {
    calculator.displayValue = 'Error';
    resetCalculator();
  } else {
    calculator.displayValue = parseFloat(result.toFixed(9)).toString();
    calculator.firstOperand = null;
    calculator.operator = null;
    calculator.waitingForSecondOperand = false;
  }

  clearActiveOperator();
}

// Reset/Clear Logic
function handleClear() {
  const clearBtn = document.getElementById('btn-clear');
  
  if (clearBtn.textContent === 'C') {
    // Clear only current entry
    calculator.displayValue = '0';
  } else {
    // All Clear (AC)
    resetCalculator();
  }
  clearActiveOperator();
}

function resetCalculator() {
  calculator.displayValue = '0';
  calculator.firstOperand = null;
  calculator.waitingForSecondOperand = false;
  calculator.operator = null;
}

function clearActiveOperator() {
  const buttons = document.querySelectorAll('.calc-btn');
  buttons.forEach(btn => btn.classList.remove('active-op'));
}

// Click Event Listeners
const keypad = document.querySelector('.calc-keypad');
keypad.addEventListener('click', (event) => {
  const { target } = event;

  if (!target.matches('button')) {
    return;
  }

  if (target.dataset.action === 'clear') {
    handleClear();
    updateDisplay();
    return;
  }

  if (target.dataset.action === 'toggle-sign') {
    toggleSign();
    updateDisplay();
    return;
  }

  if (target.dataset.action === 'percent') {
    inputPercent();
    updateDisplay();
    return;
  }

  if (target.dataset.action === 'decimal') {
    inputDecimal();
    updateDisplay();
    return;
  }

  if (target.dataset.operator) {
    handleOperator(target.dataset.operator);
    updateDisplay();
    return;
  }

  if (target.dataset.action === 'calculate') {
    handleCalculate();
    updateDisplay();
    return;
  }

  if (target.dataset.number) {
    inputDigit(target.dataset.number);
    updateDisplay();
    return;
  }
});

// Physical Keyboard Event Listeners
document.addEventListener('keydown', (event) => {
  const { key } = event;

  // Numbers 0-9
  if (/[0-9]/.test(key)) {
    event.preventDefault();
    inputDigit(key);
    updateDisplay();
  }
  // Decimal points
  else if (key === '.' || key === ',') {
    event.preventDefault();
    inputDecimal();
    updateDisplay();
  }
  // Operators
  else if (key === '+') {
    event.preventDefault();
    handleOperator('add');
    updateDisplay();
  }
  else if (key === '-') {
    event.preventDefault();
    handleOperator('subtract');
    updateDisplay();
  }
  else if (key === '*' || key.toLowerCase() === 'x') {
    event.preventDefault();
    handleOperator('multiply');
    updateDisplay();
  }
  else if (key === '/') {
    event.preventDefault();
    handleOperator('divide');
    updateDisplay();
  }
  // Calculate
  else if (key === 'Enter' || key === '=') {
    event.preventDefault();
    handleCalculate();
    updateDisplay();
  }
  // Clear
  else if (key === 'Escape' || key === 'Delete' || key === 'Backspace') {
    event.preventDefault();
    handleClear();
    updateDisplay();
  }
  // Percent
  else if (key === '%') {
    event.preventDefault();
    inputPercent();
    updateDisplay();
  }
});

// Initial Render
updateDisplay();
