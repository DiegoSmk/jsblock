/**
 * 04-classes-modifiers.ts
 *
 * Demonstrates TS Class enhancements:
 * - Access Modifiers (public, private, protected)
 * - Readonly properties
 * - Abstract Classes
 * - Parameter Properties
 */

// 1. Access Modifiers
class Person {
    public name: string; // Default
    private _secret: string; // Only within Person
    protected age: number; // Person and subclasses

    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
        this._secret = "1234";
    }

    public getSecret() {
        return this._secret;
    }
}

class Employee extends Person {
    constructor(name: string, age: number, public department: string) {
        super(name, age);
    }

    public getAge() {
        return this.age; // OK (protected)
    }

    // public getSecretCode() {
    //     return this._secret; // Error (private)
    // }
}

// 2. Parameter Properties (Shorthand)
class Octopus {
    readonly numberOfLegs: number = 8;

    // Automatically creates and assigns class property 'name'
    constructor(readonly name: string) { }
}

// 3. Abstract Classes
abstract class Department {
    constructor(public name: string) { }

    printName(): void {
        console.log("Department name: " + this.name);
    }

    abstract printMeeting(): void; // Must be implemented in derived classes
}

class AccountingDepartment extends Department {
    constructor() {
        super("Accounting");
    }

    printMeeting(): void {
        console.log("The Accounting Department meets each Monday at 10am.");
    }
}

// const dept = new Department(); // Error: Cannot create instance of abstract class
const acct = new AccountingDepartment();
acct.printName();
acct.printMeeting();
