/**
 * 07-modules-target.js
 *
 * Imports data from source and demonstrates module usage.
 */

import mainExport, { API_URL, Logger as MyLogger } from './07-modules-source';
import * as Utils from './07-modules-source';

console.log("Default Import:", mainExport());
console.log("Named Import:", API_URL);

MyLogger.log("Testing Alias Import");

// Namespace usage
console.log("Namespace usage:", Utils.TIMEOUT);

// Dynamic Import
async function loadDynamic() {
    const module = await import('./04-objects-classes.js');
    console.log("Dynamic module loaded");
}
