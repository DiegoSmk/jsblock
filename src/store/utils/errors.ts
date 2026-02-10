/**
 * Checks if an error is an intentional user cancellation.
 */
export function isCancellation(err: unknown): boolean {
    return err instanceof Error && err.message === 'cancel';
}

/**
 * Standardized catch handler to ignore user cancellations.
 * Logs other errors to the console.
 */
export function ignoreCancellation(err: unknown): void {
    if (!isCancellation(err)) {
        console.error("Operation failed:", err);
    }
}
