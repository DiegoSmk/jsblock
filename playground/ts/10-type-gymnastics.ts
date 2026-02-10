/* eslint-disable */
/**
 * 10-type-gymnastics.ts
 *
 * Advanced Type System Manipulations:
 * - Conditional Types with 'infer'
 * - Module Augmentation
 * - 'this' parameters
 * - Covariance / Contravariance
 * - Index Access Types
 */

// 1. Conditional Types & 'infer' keyword
type ReturnTypeCustom<T> = T extends (...args: any[]) => infer R ? R : any;

function complexFn() { return { x: 10, y: "hello" }; }
type Result = ReturnTypeCustom<typeof complexFn>; // { x: number, y: string }

type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
type A = UnpackPromise<Promise<string>>; // string
type B = UnpackPromise<number>; // number

// 2. 'this' Parameter constraints
interface DOMElement {
    addEventListener(type: string, handler: (this: void, e: Event) => void): void;
}
function handleClick(this: void, e: Event) {
    console.log("Clicked");
}

// 3. Module Augmentation (Simulated)
// Normally in a .d.ts file, but valid here
export { }; // Ensure this is a module
declare global {
    interface String {
        toFancyString(): string;
    }
}
// String.prototype.toFancyString = () => "Fancy!";

// 4. Index Access Types (Lookups)
type APIResponse = {
    user: {
        id: number;
        settings: {
            theme: "dark" | "light";
        };
    };
};
type Theme = APIResponse["user"]["settings"]["theme"]; // "dark" | "light"

// 5. Key Remapping (Mapped Types + 'as')
type Getters<T> = {
    [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
};
interface Person {
    name: string;
    age: number;
}
type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number; }

console.log("Type gymnastics complete");
