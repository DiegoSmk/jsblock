/**
 * Checks if an error is an intentional user cancellation.
 */
export function isCancellation(err: unknown): boolean {
    if (typeof err === 'string') return err === 'cancel';
    if (err && typeof err === 'object' && 'message' in err) {
        return (err as { message: unknown }).message === 'cancel';
    }
    return false;
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
