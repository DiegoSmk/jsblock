/**
 * 07-modules-source.js
 *
 * Exports data to be used by the target module.
 */

export const API_URL = "https://api.example.com";
export const TIMEOUT = 5000;

export function formatDate(date) {
    return date.toISOString();
}

export class Logger {
    static log(msg) {
        console.log(`[LOG]: ${msg}`);
    }
}

const privateSecret = "hidden";

export default function mainExport() {
    return "I am the default export";
}
