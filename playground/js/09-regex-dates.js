/**
 * 09-regex-dates.js
 *
 * Demonstrates Built-in Objects:
 * - RegExp (Literal & Constructor)
 * - Date (Parsing, Formatting)
 * - Math (Static methods)
 */

// 1. Regular Expressions
const text = "Hello World 2024";
const regexLiteral = /\w+/g;
const regexConstructor = new RegExp("\\d+", "g");

const matches = text.match(regexLiteral); // ['Hello', 'World', '2024']
const hasNumbers = regexConstructor.test(text); // true
const replaced = text.replace(/World/, "Universe");

console.log({ matches, hasNumbers, replaced });

// Groups
const dateStr = "2024-12-25";
const dateRegex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const groups = dateStr.match(dateRegex)?.groups;
console.log("Groups:", groups); // { year: '2024', month: '12', day: '25' }

// 2. Date
const now = new Date();
const epoch = new Date(0);
const specific = new Date("2024-01-01T00:00:00Z");

console.log("ISO:", now.toISOString());
console.log("Year:", now.getFullYear());
console.log("Time:", now.getTime());

// 3. Math
const pi = Math.PI;
const max = Math.max(10, 20, 5, 100);
const random = Math.random(); // 0-1
const floored = Math.floor(3.99);
const ceiled = Math.ceil(3.01);
const rounded = Math.round(3.5);

console.log({ pi, max, random, floored });
