/**
 * 05-async.js
 *
 * Demonstrates Asynchronous JavaScript:
 * - Callbacks (legacy)
 * - Promises (creation, chaining, error handling)
 * - Async / Await
 * - Promise.all / Promise.race
 */

// 1. Logic simulation delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 2. Promise Creation
function getData(id) {
    return new Promise((resolve, reject) => {
        console.log(`Fetching data for ID: ${id}...`);
        setTimeout(() => {
            if (id < 0) {
                reject(new Error("Invalid ID"));
            } else {
                resolve({ id, name: "Sample Data" });
            }
        }, 1000);
    });
}

// 3. Promise Chaining
getData(1)
    .then(data => {
        console.log("Data received:", data);
        return getData(2);
    })
    .then(data2 => {
        console.log("Data 2 received:", data2);
    })
    .catch(err => {
        console.error("Promise Error:", err.message);
    })
    .finally(() => {
        console.log("Promise chain finished");
    });

// 4. Async / Await
async function processData() {
    try {
        console.log("Start async process...");
        const d1 = await getData(10);
        console.log("Async 1:", d1);

        await delay(500);

        const d2 = await getData(20);
        console.log("Async 2:", d2);

        return "Success";
    } catch (e) {
        console.error("Async Error:", e.message);
        throw e;
    }
}

// 5. Parallel Execution
async function parallelProcess() {
    console.log("Starting parallel...");
    const [r1, r2, r3] = await Promise.all([
        getData(100),
        getData(200),
        delay(1500).then(() => "Delayed")
    ]);
    console.log("Parallel results:", r1, r2, r3);
}

// Execute
// processData().then(() => parallelProcess());
