/**
 * 08-data-structures.js
 *
 * Demonstrates ES6+ Data Structures:
 * - Map & WeakMap
 * - Set & WeakSet
 * - Iteration over collections
 */

// 1. Map (Key-Value pairs with any type keys)
const map = new Map();
const keyObj = { id: 1 };
const keyFunc = () => { };

map.set('string', 'value');
map.set(keyObj, 'Object Value');
map.set(keyFunc, 'Function Value');

console.log("Map size:", map.size);
console.log("Get by obj:", map.get(keyObj));

// Iterating Map
for (const [key, val] of map) {
    console.log(key, val);
}

// 2. Set (Unique values)
const set = new Set([1, 2, 2, 3, 3, 4]); // 1, 2, 3, 4
set.add(5);
console.log("Set has 2:", set.has(2));
console.log("Set values:", ...set);

// 3. WeakMap (Keys must be objects, weak references)
let cacheKey = { id: 100 };
const weakMap = new WeakMap();
weakMap.set(cacheKey, "Cached Data");

// If cacheKey is set to null, the entry is garbage collected
// cacheKey = null; 

// 4. WeakSet (Objects only, weak refs)
const visited = new WeakSet();
let node = { id: "root" };
visited.add(node);
console.log("Visited node:", visited.has(node));
