import { expect } from 'chai';
import { isSafeAlter, ChangeClassification } from '../../../src/schema-sync/utils/ChangeClassification';

describe('Migration Matrix Validation', () => {
    it('should classify varchar(50) -> varchar(100) as WIDEN', () => {
        const result = isSafeAlter({ type: 'varchar', length: 50 }, { type: 'varchar', length: 100 });
        expect(result).to.equal(ChangeClassification.WIDEN);
    });

    it('should classify varchar(100) -> varchar(50) as NARROW', () => {
        const result = isSafeAlter({ type: 'varchar', length: 100 }, { type: 'varchar', length: 50 });
        expect(result).to.equal(ChangeClassification.NARROW);
    });

    it('should classify int -> bigint as WIDEN', () => {
        const result = isSafeAlter({ type: 'int' }, { type: 'bigint' });
        expect(result).to.equal(ChangeClassification.WIDEN);
    });

    it('should classify int -> varchar as INCOMPATIBLE', () => {
        const result = isSafeAlter({ type: 'int' }, { type: 'varchar' });
        expect(result).to.equal(ChangeClassification.INCOMPATIBLE);
    });
});
