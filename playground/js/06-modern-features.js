/**
 * 06-modern-features.js
 *
 * Demonstrates ES6+ Features:
 * - Array & Object Destructuring
 * - Spread Syntax (...)
 * - Rest Parameters
 * - Template Literals (tagged)
 * - Optional Chaining (?.)
 * - Nullish Coalescing (??)
 */

const user = {
    id: 1,
    profile: {
        firstName: "Diego",
        lastName: "Developer",
        skills: ["JS", "TS", "React"]
    },
    settings: null
};

// 1. Destructuring
// Object
const { profile: { firstName, skills: [primarySkill] } } = user;
console.log(firstName, primarySkill); // Diego, JS

// Array
const colors = ["red", "green", "blue", "yellow"];
const [first, second, ...restColors] = colors;
console.log(first, restColors);

// 2. Spread Syntax
const defaults = { theme: "dark", lang: "en" };
const config = { ...defaults, theme: "light", debug: true }; // Merge/Override

const newArray = [...colors, "purple"];

// 3. Optional Chaining
const theme = user?.settings?.theme; // undefined (no error)
const nonExistentMethod = user.profile?.getAge?.(); // undefined

// 4. Nullish Coalescing
const input = null;
const value = input ?? "Default Value"; // "Default Value"
const zero = 0;
const numberVal = zero || 100; // 100 (falsy)
const numberNullish = zero ?? 100; // 0 (defined)

// 5. Computed Property Names
const key = "dynamicKey";
const dynamicObj = {
    [key]: "Dynamic Value",
    ["computed" + 1]: true
};

console.log("Modern features test complete");
