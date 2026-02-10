/* eslint-disable */
/**
 * 05-decorators.ts
 *
 * Demonstrates TypeScipt Decorators (Experimental):
 * - Class Decorators
 * - Method Decorators
 * - Property Decorators
 * - Parameter Decorators
 * 
 * Note: Requires "experimentalDecorators": true in tsconfig.json
 */

// 1. Class Decorator
function Sealed(constructor: Function) {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
    console.log(`Sealed class: ${constructor.name}`);
}

@Sealed
class BugReport {
    type = "report";
    title: string;

    constructor(t: string) {
        this.title = t;
    }
}

// 2. Method Decorator
function Enumerable(value: boolean) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.enumerable = value;
    };
}

// 3. Property Decorator
// function LogProperty(target: any, key: string) {
//     let val = target[key];
//     const getter = () => {
//         console.log(`Get: ${key} => ${val}`);
//         return val;
//     };
//     const setter = (next: any) => {
//         console.log(`Set: ${key} => ${next}`);
//         val = next;
//     };
//     Object.defineProperty(target, key, {
//         get: getter,
//         set: setter,
//         enumerable: true,
//         configurable: true
//     });
// }

class Greeter {
    @Enumerable(false)
    greet() {
        return "Hello, " + this.greeting;
    }

    greeting: string;
    constructor(message: string) {
        this.greeting = message;
    }
}

console.log("Decorators loaded");
