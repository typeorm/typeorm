import { EntitySchema } from "../../../../src"

import { C } from "../entity"

export const CSchema = new EntitySchema<C>({
    target: C,
    name: "C",
    type: "entity-child",
    discriminatorValue: "custom-c",
    columns: {
        c: {
            type: String,
        },
    },
})
