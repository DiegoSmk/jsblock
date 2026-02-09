/**
 * 03-advanced-types.ts
 *
 * Demonstrates Advanced Typing:
 * - Union & Intersection Types
 * - Type Aliases
 * - Literal Types
 * - Generics
 * - Utility Types (Partial, Pick, Omit)
 */

// 1. Union Types
function padLeft(value: string, padding: string | number) {
    if (typeof padding === "number") {
        return Array(padding + 1).join(" ") + value;
    }
    return padding + value;
}

// 2. Intersection Types
interface BusinessPartner {
    name: string;
    credit: number;
}
interface Contact {
    email: string;
    phone: string;
}
type Customer = BusinessPartner & Contact;

const client: Customer = {
    name: "Acme Corp",
    credit: 1000,
    email: "info@acme.com",
    phone: "555-0100"
};

// 3. Generics
function identity<T>(arg: T): T {
    return arg;
}
const output1 = identity<string>("myString");
const output2 = identity<number>(100);

// Generic Interface
interface GenericIdentityFn<T> {
    (arg: T): T;
}
const myIdentity: GenericIdentityFn<number> = identity;

// Generic Class
class GenericNumber<T> {
    zeroValue: T;
    add: (x: T, y: T) => T;
}

// 4. Utility Types
interface Todo {
    title: string;
    description: string;
    completed: boolean;
}

// Partial
const todoPart: Partial<Todo> = { title: "Clean room" };

// Pick
const todoPick: Pick<Todo, "title" | "completed"> = {
    title: "Clean room",
    completed: false
};

// Omit
const todoOmit: Omit<Todo, "description"> = {
    title: "Clean room",
    completed: false
};

// 5. Mapped Types
type ReadonlyTodo = {
    readonly [P in keyof Todo]: Todo[P];
};
