/**
 * 07-utility-types.ts
 *
 * Demonstrates Built-in Utility Types:
 * - Record
 * - Partial, Required, Readonly
 * - Pick, Omit
 * - Exclude, Extract
 * - NonNullable
 * - ReturnType, Parameters
 */

interface Todo {
    title: string;
    description?: string;
}

// 1. Record<Key, Type>
const pageConfig: Record<string, string> = {
    home: "Home Page",
    about: "About Us"
};

// 2. Required<T> (Makes all properties common)
const completeTodo: Required<Todo> = {
    title: "Finish work",
    description: "Urgent" // Now required
};

// 3. Readonly<T>
const readonlyTodo: Readonly<Todo> = {
    title: "Read only"
};
// readonlyTodo.title = "Edit"; // Error

// 4. Exclude<T, U>
type T0 = Exclude<"a" | "b" | "c", "a">; // "b" | "c"

// 5. Extract<T, U>
type T1 = Extract<"a" | "b" | "c", "a" | "f">; // "a"

// 6. NonNullable<T>
type T2 = NonNullable<string | number | undefined>; // string | number

// 7. ReturnType<T>
function createData() {
    return { x: 10, y: 20 };
}
type Data = ReturnType<typeof createData>; // { x: number, y: number }

// 8. Parameters<T>
type Params = Parameters<typeof createData>; // []
