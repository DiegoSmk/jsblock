/**
 * 08-type-guards.ts
 *
 * Demonstrates Narrowing and Safety:
 * - Type Predicates (is)
 * - Discriminated Unions
 * - 'in' operator
 * - instanceof
 */

// 1. Type Predicates (User-defined Type Guards)
interface Fish { swim: () => void }
interface Bird { fly: () => void }

function isFish(pet: Fish | Bird): pet is Fish {
    return (pet as Fish).swim !== undefined;
}

function move(pet: Fish | Bird) {
    if (isFish(pet)) {
        pet.swim(); // TS knows pet is Fish here
    } else {
        pet.fly(); // TS knows pet is Bird here
    }
}

// 2. Discriminated Unions (Tagged Unions)
interface Circle {
    kind: "circle"; // Discriminant
    radius: number;
}
interface Square {
    kind: "square"; // Discriminant
    sideLength: number;
}

type Shape = Circle | Square;

function getArea(shape: Shape) {
    switch (shape.kind) {
        case "circle":
            return Math.PI * shape.radius ** 2; // TS knows it's Circle
        case "square":
            return shape.sideLength ** 2; // TS knows it's Square
        default:
            const _exhaustiveCheck: never = shape;
            return _exhaustiveCheck;
    }
}

// 3. 'in' operator
function checkProp(obj: object) {
    if ('foo' in obj) {
        console.log("Object has foo");
    }
}

// 4. instanceof
class MyClass { }
const instance = new MyClass();
if (instance instanceof MyClass) {
    console.log("Is instance");
}
