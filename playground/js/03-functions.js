/**
 * 03-functions.js
 *
 * Demonstrates various function definitions and behaviors:
 * - Function Declaration
 * - Function Expression
 * - Arrow Functions (Implicit return, block body)
 * - Default Parameters
 * - Rest Parameters
 * - Generator Functions
 * - IIFE (Immediately Invoked Function Expression)
 */

// 1. Function Declaration
function add(a, b) {
    return a + b;
}

// 2. Function Expression
const subtract = function (a, b) {
    return a - b;
};

// 3. Arrow Functions
const multiply = (a, b) => a * b; // Implicit return

const divide = (a, b) => { // Block body
    if (b === 0) return 0;
    return a / b;
};

// 4. Parameters
function greet(name = "Guest", ...titles) {
    console.log(`Hello, ${titles.join(" ")} ${name}`);
}

greet("Diego", "Mr.", "Dr."); // Rest params

// 5. Generator Function
function* idGenerator() {
    let id = 1;
    while (true) {
        yield id++;
    }
}
const gen = idGenerator();
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2

// 6. IIFE
(function () {
    console.log("I run immediately!");
})();

// 7. Higher-Order Function
function operate(fn, a, b) {
    return fn(a, b);
}
const result = operate(add, 10, 20);
console.log("Higher-order result:", result);
