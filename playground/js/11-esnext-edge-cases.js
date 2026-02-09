/**
 * 11-esnext-edge-cases.js
 *
 * Demonstrates newer ES features and edge cases:
 * - BigInt
 * - Symbols
 * - Private Hash Fields (#private)
 * - Static Initialization Blocks
 * - Labelled Statements
 * - Top-Level Await (module only)
 */

// 1. BigInt (ES2020)
const maxSafe = Number.MAX_SAFE_INTEGER;
const bigIntVal = 9007199254740991n; // 'n' suffix
const bigAdd = bigIntVal + 10n;
// console.log(bigIntVal + 1); // Error: Cannot mix BigInt and other types

// 2. Symbols (ES6)
const sym1 = Symbol("description");
const symKey = Symbol("my-key");
const obj = {
    [symKey]: "Hidden Value",
    visible: true
};
console.log(obj[symKey]); // Hidden Value

// 3. Private Fields & Static Blocks (ES2022)
class ModernClass {
    #privateField = "secret"; // Native private (runtime check)
    static #staticPrivate = "static-secret";
    static publicStatic;

    static {
        // Static Initialization Block
        console.log("Static Init Block running");
        this.publicStatic = this.#staticPrivate + "-initialized";
    }

    getSecret() {
        return this.#privateField;
    }
}
const inst = new ModernClass();
// console.log(inst.#privateField); // Syntax Error

// 4. Labelled Statements (Rare but valid)
let str = "";
loop1:
for (let i = 0; i < 5; i++) {
    if (i === 1) {
        continue loop1;
    }
    str = str + i;
    loop2:
    for (let j = 0; j < 5; j++) {
        if (j > 1) break loop2; // Break inner
        if (i === 2) break loop1; // Break outer
    }
}

// 5. 'in' operator for private fields check
class C {
    #brand;
    static isC(obj) {
        return #brand in obj;
    }
}
