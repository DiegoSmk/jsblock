/**
 * 12-the-one-percent.js
 *
 * The esoteric, the dangerous, and the bleeding edge.
 * - SharedArrayBuffer & Atomics (Multi-threading primitives)
 * - WeakRef & FinalizationRegistry (GC Hooks)
 * - Tagged Templates (Advanced DSLs)
 * - The 'arguments' object (Legacy)
 * - eval() & new Function() (Dynamic Execution)
 */

// 1. Shared Memory & Atomics (Wait, Notify)
// Note: SharedArrayBuffer requires specific headers in browsers (COOP/COEP)
try {
    const sab = new SharedArrayBuffer(1024);
    const int32 = new Int32Array(sab);
    Atomics.store(int32, 0, 123);
    const value = Atomics.load(int32, 0);
    const exchanged = Atomics.exchange(int32, 0, 456);
    console.log({ value, exchanged });
} catch (e) {
    console.warn("SharedArrayBuffer not supported/enabled in this environment");
}

// 2. WeakRef & FinalizationRegistry (Cleanup callbacks)
let target = { id: "temporary" };
const ref = new WeakRef(target);
const registry = new FinalizationRegistry(heldValue => {
    console.log(`Cleaned up: ${heldValue}`);
});
registry.register(target, "some-metadata");

setTimeout(() => {
    const derefed = ref.deref();
    if (derefed) {
        console.log("Target is still alive");
    } else {
        console.log("Target collected");
    }
    target = null; // Enable GC
}, 1000);

// 3. Tagged Templates (DSL Construction)
function html(strings, ...values) {
    return strings.reduce((acc, str, i) => {
        const value = values[i] ? `<b>${values[i]}</b>` : "";
        return acc + str + value;
    }, "");
}
const user = "Diego";
const output = html`Welcome, ${user}!`; // Welcome, <b>Diego</b>!

// 4. The 'arguments' Object (Legacy Magic)
function legacyFn() {
    // 'arguments' is array-like but not an Array
    return Array.from(arguments).join("-");
}
console.log(legacyFn(1, 2, 3)); // "1-2-3"

// 5. Dynamic Execution (The Forbidden Zone)
// Parsers hate this because it breaks scope analysis
const dynamicAdd = new Function('a', 'b', 'return a + b');
console.log(dynamicAdd(2, 6)); // 8

try {
    eval("var leakedVar = 'I am global now'");
    // console.log(leakedVar);
} catch (e) { }

console.log("The 1% loaded.");
