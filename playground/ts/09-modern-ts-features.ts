/**
 * 09-modern-ts-features.ts
 * 
 * Demonstrates Modern TypeScript 4.x/5.x Features:
 * - 'satisfies' Operator
 * - Template Literal Types
 * - Recursive Type Definitions
 * - Asserts Functions
 */

// 1. 'satisfies' Operator (TS 4.9)
// Enforces type constraint without changing the inferred type
type Colors = "red" | "green" | "blue";
type RGB = [number, number, number];

const palette = {
    red: [255, 0, 0],
    green: "#00ff00",
    blue: [0, 0, 255]
} satisfies Record<Colors, string | RGB>;

// TS knows 'red' is array, and 'green' is string
const redVal = palette.red[0];
const greenVal = palette.green.toUpperCase();

// 2. Template Literal Types
type World = "world";
type Greeting = `hello ${World}`; // "hello world"

type CssPadding = "padding-left" | "padding-right" | "padding-top" | "padding-bottom";

// 3. Recursive Types (JSON)
type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
interface JsonObject {
    [key: string]: JsonValue;
}
interface JsonArray extends Array<JsonValue> { }

const data: JsonValue = {
    caption: "test",
    count: 100,
    list: [true, { nested: "value" }]
};

// 4. Asserts Functions
function assertString(val: any): asserts val is string {
    if (typeof val !== "string") {
        throw new Error("Not a string!");
    }
}

function processValue(val: any) {
    assertString(val);
    // TS knows val is string now
    console.log(val.toUpperCase());
}

// 5. Variadic Tuple Types
type StrNum = [string, number];
type BoolStrNum = [boolean, ...StrNum]; // [boolean, string, number]
