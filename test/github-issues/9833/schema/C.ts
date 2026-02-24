import { EntitySchema } from "../../../../src"

import { C } from "../entity"

export const CSchema = new EntitySchema<C>({
    target: C,
    name: "C",
    type: "entity-child",
    columns: {
        c: {
            type: String,
        },
    },
})
