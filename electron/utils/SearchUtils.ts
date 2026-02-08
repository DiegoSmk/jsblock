import { SearchOptions } from '../types';

export function createSearchPattern(query: string, options: SearchOptions): RegExp | null {
    try {
        if (options.regex) {
            return new RegExp(query, options.caseSensitive ? 'g' : 'gi');
        } else {
            return new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options.caseSensitive ? 'g' : 'gi');
        }
    } catch (err) {
        return null;
    }
}
