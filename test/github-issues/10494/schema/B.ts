import { EntitySchema } from "../../../../src"

import { B } from "../entity"

export const BSchema = new EntitySchema<B>({
    target: B,
    name: "B",
    type: "entity-child",
    columns: {
        b: {
            type: Number,
        },
    },
})
