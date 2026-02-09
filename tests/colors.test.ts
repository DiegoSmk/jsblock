import { describe, it, expect } from 'vitest';
import { hexToRgba } from '../src/utils/colors';

describe('hexToRgba', () => {
    it('should convert a hex color to rgba with valid alpha', () => {
        expect(hexToRgba('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
        expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
        expect(hexToRgba('#ff0000', 0)).toBe('rgba(255, 0, 0, 0)');
    });

    it('should return black with same alpha for invalid hex strings', () => {
        expect(hexToRgba('', 0.5)).toBe('rgba(0,0,0,0.5)');
        expect(hexToRgba('#fff', 0.8)).toBe('rgba(0,0,0,0.8)');
        expect(hexToRgba('not-a-hex', 1)).toBe('rgba(0,0,0,1)');
    });

    it('should handle hex strings without # by treating them as invalid in current implementation', () => {
        // Based on current logic: if (hex.length < 7) return ...
        expect(hexToRgba('ffffff', 1)).toBe('rgba(0,0,0,1)');
    });

    it('should handle invalid hex characters by returning black with alpha', () => {
        // parseInt('XX', 16) is NaN
        expect(hexToRgba('#XXXXXX', 1)).toBe('rgba(0,0,0,1)');
    });

    it('should correctly parse mixed hex colors', () => {
        expect(hexToRgba('#123456', 0.1)).toBe('rgba(18, 52, 86, 0.1)');
    });
});
