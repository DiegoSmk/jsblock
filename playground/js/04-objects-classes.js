/**
 * 04-objects-classes.js
 *
 * Demonstrates Object-Oriented Programming in JS:
 * - Object Literals
 * - Classes & Constructors
 * - Inheritance (extends)
 * - Static Methods
 * - Getters & Setters
 * - Method Definitions
 */

// 1. Object Literal
const car = {
    brand: "Toyota",
    model: "Corolla",
    start() {
        console.log("Engine started");
    },
    get info() {
        return `${this.brand} ${this.model}`;
    }
};

// 2. Class Definition
class Animal {
    constructor(name) {
        this.name = name;
        this._energy = 100;
    }

    speak() {
        console.log(`${this.name} makes a noise.`);
    }

    get energy() {
        return this._energy;
    }

    set energy(value) {
        if (value < 0) this._energy = 0;
        else this._energy = value;
    }
}

// 3. Inheritance
class Dog extends Animal {
    constructor(name, breed) {
        super(name); // Call parent constructor
        this.breed = breed;
    }

    // Method Override
    speak() {
        console.log(`${this.name} barks.`);
    }

    fetch() {
        this.energy -= 10;
        console.log(`${this.name} is fetching... Energy: ${this.energy}`);
    }

    static category() {
        return "Mammal";
    }
}

const rex = new Dog("Rex", "German Shepherd");
rex.speak();
rex.fetch();
console.log(Dog.category()); // Static method call
