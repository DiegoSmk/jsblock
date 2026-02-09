/**
 * 01-basics.js
 *
 * This file demonstrates basic JavaScript syntax, variables, types, and operators.
 * It serves as a visual test for:
 * - VariableNode (var, let, const)
 * - LiteralNode (string, number, boolean, null, undefined)
 * - LogicNode (binary expressions)
 * - Assignment handling
 */

// 1. Variable Declarations
var oldSchoolVar = "I am a var";
let modernLet = "I am a let";
const constantValue = "I am a const";

// 2. Primitive Types
const stringType = 'Single quotes';
const doubleQuotes = "Double quotes";
const templateLiteral = `Template literal with ${modernLet}`;
const numberInteger = 42;
const numberFloat = 3.14159;
const numberNegative = -100;
const booleanTrue = true;
const booleanFalse = false;
const nullValue = null;
const undefinedValue = undefined;

// 3. Operators & Logic
// Arithmetic
const sum = 10 + 5;
const difference = 20 - 8;
const product = 6 * 7;
const quotient = 100 / 4;
const remainder = 10 % 3;
const exponentiation = 2 ** 3;

// Comparison
const isEqual = (10 == "10"); // true (loose)
const isStrictEqual = (10 === 10); // true (strict)
const isNotEqual = (5 != "5");
const isStrictNotEqual = (5 !== "5");
const isGreater = (10 > 5);
const isLess = (5 < 10);
const isGreaterOrEqual = (10 >= 10);

// Logical
const andLogic = true && false;
const orLogic = true || false;
const notLogic = !true;

// 4. Assignments & Updates
let counter = 0;
counter = counter + 1;
counter += 5;
counter++;
counter--;

console.log("Basics loaded:", { stringType, numberInteger, booleanTrue });
