import {EntitySchema} from '../../../../../../src';
import {Extendable} from '../extendable';

export const ExtendableSchema = new EntitySchema<Extendable>({
    target: Extendable,
    name: Extendable.name.toLowerCase(),
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: "increment",
        },
        value: {
            type: Number
        }
    }
})
