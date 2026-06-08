export class ColumnValueHandler {
    static normalizeNumeric(value: any): number {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    static canonicalizeType(type: string): string {
        return type.toLowerCase().trim();
    }
}
