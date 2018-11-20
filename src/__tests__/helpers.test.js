const { resolve } = require('../helpers');

describe('Helper test', () => {
    it('should handle undefined path', () => {
        const obj = { a: { b: 1, c: 2 } };

        expect(resolve('a.b.unknown', obj)).toBeUndefined();
    });

    it('should handle simple case', () => {
        const obj = { a: { b: 1, c: 2 } };

        expect(resolve('a.b', obj)).toEqual(1);
    });

    it('should handle another separator', () => {
        const obj = { a: { 'b.d': 1, c: 2 } };

        expect(resolve('a->b.d', obj, '->')).toEqual(1);
    });

    it('should handle empty objects', () => {
        expect(resolve('a', undefined)).toBeUndefined();
    });

    it('should handle array for path', () => {
        const obj = { a: { b: 1, c: 2 } };

        expect(resolve(['a', 'c'], obj)).toEqual(2);
    });
});
