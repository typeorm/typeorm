import { EntitySchema } from '../../../../../../src';
import { Extending } from '../extending';
import {ExtendableSchema} from './extendable';

export const ExtendingSchema = new EntitySchema<Extending>({
    target: Extending,
    name: Extending.name.toLowerCase(),
    columns: {
        ...ExtendableSchema.options.columns,
        value: {
            type: 'decimal',
            precision: 4,
            scale: 2,
            unique: true
        }
    },
})
