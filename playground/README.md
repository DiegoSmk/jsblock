# JS/TS Playground

This directory contains comprehensive examples of JavaScript and TypeScript features.
It is intended to be used as a test suite for the **JS Blueprints** editor to ensure:
- Correct Abstract Syntax Tree (AST) parsing.
- Precise visualization of code flow and relationships.
- Accurate identifying of scopes, variables, and dependencies.

## Structure

### JavaScript (`/js`)
- `01-basics.js`: Variables, primitives, operators.
- `02-control-flow.js`: If/else, switches, loops, error handling.
- `03-functions.js`: Declarations, expressions, arrows, generators, IIFE.
- `04-objects-classes.js`: Objects, classes, inheritance, prototypes.
- `05-async.js`: Promises, async/await, concurrent execution.
- `06-modern-features.js`: Destructuring, spread/rest, optional chaining.
- `07-modules-*.js`: ESM Import/Export relationships.
- `08-data-structures.js`: Map, Set, WeakMap, WeakSet.
- `09-regex-dates.js`: RegExp expressions, groups, Date parsing, Math.
- `10-advanced-patterns.js`: Closures, explicit bindings (call/apply/bind), Proxy/Reflect.
- `11-esnext-edge-cases.js`: BigInt, Symbol, Labels, Hash Private Fields (#), Static Blocks.
- `12-the-one-percent.js`: SharedArrayBuffer, Atomics, WeakRef, FinalizationRegistry, Tagged Templates, eval, arguments.

### TypeScript (`/ts`)
- `01-types-basics.ts`: Primitives, enums, tuples, assertions.
- `02-interfaces.ts`: Interface declaration, extension, implementation.
- `03-advanced-types.ts`: Generics, unions, intersections, utility types.
- `04-classes-modifiers.ts`: Public/private/protected, abstract classes.
- `05-decorators.ts`: Class and method decorators (experimental).
- `06-namespaces.ts`: Structural namespaces and modules.
- `07-utility-types.ts`: Record, Partial, Pick, Omit, Exclude.
- `08-type-guards.ts`: Custom predicates, discriminated unions, narrowing.
- `09-modern-ts-features.ts`: `satisfies`, Template Literal Types, Recursive Types.
- `10-type-gymnastics.ts`: Conditional types (`infer`), Key Remapping, Module Augmentation, `this` parameters.

## How to Use
Open these files within the editor to verify if the graph generation represents the code structure accurately.
