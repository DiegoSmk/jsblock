/**
 * 10-advanced-patterns.js
 *
 * Demonstrates Advanced JS Concepts:
 * - Closures
 * - 'this' Binding (call, apply, bind)
 * - Proxy & Reflect (Metaprogramming)
 */

// 1. Closures
function makeCounter(initial) {
    let count = initial;
    return {
        increment: () => ++count,
        decrement: () => --count,
        get: () => count
    };
}
const counter = makeCounter(10);
console.log(counter.increment()); // 11
console.log(counter.get()); // 11
// count is inaccessible directly

// 2. 'this' Binding
const person = {
    name: "Diego",
    greet(greeting) {
        console.log(`${greeting}, ${this.name}`);
    }
};

const anotherPerson = { name: "Alice" };

// Call
person.greet.call(anotherPerson, "Hi"); // Hi, Alice

// Apply (args array)
person.greet.apply(anotherPerson, ["Hello"]); // Hello, Alice

// Bind (returns new function)
const boundGreet = person.greet.bind(anotherPerson);
boundGreet("Welcome"); // Welcome, Alice

// 3. Proxy (Interception)
const target = {
    message: "Secret"
};

const handler = {
    get: function (obj, prop) {
        if (prop === 'message') {
            return "Access Denied";
        }
        return Reflect.get(obj, prop);
    },
    set: function (obj, prop, value) {
        console.log(`Setting ${prop} to ${value}`);
        return Reflect.set(obj, prop, value);
    }
};

const proxy = new Proxy(target, handler);
console.log(proxy.message); // Access Denied
proxy.newProp = 123; // Logs: Setting newProp to 123
