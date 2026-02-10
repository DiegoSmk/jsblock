/* eslint-disable */
/**
 * 01-types-basics.ts
 *
 * Demonstrates basic TypeScript types:
 * - Primitives (string, number, boolean)
 * - Array & Tuple
 * - Enum
 * - Any, Void, Null, Undefined, Never, Unknown
 * - Type Assertions
 */

// 1. Primitives
const username: string = "Diego";
const age: number = 30;
const isActive: boolean = true;

// 2. Arrays
const skills: string[] = ["JS", "TS", "React"];
const genericArray: Array<number> = [1, 2, 3];

// 3. Tuples
let coords: [number, number] = [10, 20];
let userTuple: [string, number, boolean?] = ["Diego", 30]; // Optional element

// 4. Enums
enum Role {
    Admin,
    User,
    Guest
}
const myRole: Role = Role.Admin;

enum HttpStatus {
    OK = 200,
    NotFound = 404,
    Error = 500
}

// 5. Special Types
let randomValue: any = "Could be anything";
randomValue = 42;

let unknownValue: unknown = "Safely unknown";
if (typeof unknownValue === "string") {
    console.log(unknownValue.toUpperCase());
}

function logMessage(msg: string): void {
    console.log(msg);
}

function throwError(msg: string): never {
    throw new Error(msg);
}

// 6. Type Assertions
const someValue: unknown = "this is a string";
const strLength: number = (someValue as string).length;
const strLengthAngle: number = (<string>someValue).length;
