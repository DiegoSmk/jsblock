/**
 * 02-interfaces.ts
 *
 * Demonstrates Interfaces in TypeScript:
 * - Basic Interface
 * - Optional Properties
 * - Readonly Properties
 * - Extending Interfaces
 * - Implementing Interfaces (Class)
 * - Function Interfaces
 */

// 1. Basic Interface
interface User {
    readonly id: number; // Cannot be changed
    name: string;
    age?: number; // Optional
}

const user1: User = {
    id: 1,
    name: "Diego"
};
// user1.id = 2; // Error

// 2. Extending Interfaces
interface Employee extends User {
    department: string;
    salary: number;
}

const dev: Employee = {
    id: 2,
    name: "Jane",
    age: 28,
    department: "Engineering",
    salary: 50000
};

// 3. Interface for Functions
interface SearchFunc {
    (source: string, subString: string): boolean;
}

const mySearch: SearchFunc = (src, sub) => {
    return src.search(sub) > -1;
};

// 4. Class Implementation
interface ClockInterface {
    currentTime: Date;
    setTime(d: Date): void;
}

class Clock implements ClockInterface {
    currentTime: Date = new Date();

    setTime(d: Date) {
        this.currentTime = d;
    }

    constructor(h: number, m: number) { }
}

// 5. Index Signatures
interface StringArray {
    [index: number]: string;
}
const myArray: StringArray = ["Bob", "Fred"];
