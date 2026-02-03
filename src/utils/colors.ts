/**
 * Converts a hex color string to rgba format with the specified alpha.
 * @param hex - The hex color string (e.g., #ffffff)
 * @param alpha - Alpha value between 0 and 1
 * @returns rgba color string
 */
export const hexToRgba = (hex: string, alpha: number) => {
    // Basic validation
    if (!hex || hex.length < 7) return `rgba(0,0,0,${alpha})`;

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Check for NaN if hex was invalid
    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${alpha})`;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
