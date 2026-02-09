/**
 * 02-control-flow.js
 *
 * Demonstrates control structures:
 * - If/Else statements
 * - Switch case
 * - Loops (For, While, Do-While)
 * - Try/Catch/Finally
 */

const condition = true;
const value = 10;

// 1. If / Else
if (condition) {
    console.log("Condition is true");
} else if (value > 5) {
    console.log("Value is greater than 5");
} else {
    console.log("Else block");
}

// 2. Switch Statement
const fruit = "apple";
switch (fruit) {
    case "banana":
        console.log("Yellow");
        break;
    case "apple":
        console.log("Red");
        break;
    default:
        console.log("Unknown color");
}

// 3. Loops
// For loop
for (let i = 0; i < 5; i++) {
    console.log("For loop iteration:", i);
}

// While loop
let j = 0;
while (j < 3) {
    console.log("While loop:", j);
    j++;
}

// Do-While loop
let k = 0;
do {
    console.log("Do-While loop:", k);
    k++;
} while (k < 3);

// For...of loop (Iterables)
const array = [10, 20, 30];
for (const item of array) {
    console.log("Item:", item);
}

// For...in loop (Properties)
const obj = { a: 1, b: 2 };
for (const key in obj) {
    console.log("Key:", key, "Value:", obj[key]);
}

// 4. Error Handling
try {
    throw new Error("Something went wrong");
} catch (error) {
    console.error("Caught error:", error.message);
} finally {
    console.log("Execution finished");
}
