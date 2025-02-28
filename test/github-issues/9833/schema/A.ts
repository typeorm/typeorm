import { EntitySchema } from "../../../../src"

import { A } from "../entity"

export const ASchema = new EntitySchema<A>({
    target: A,
    name: "A",
    type: "entity-child",
    columns: {
        a: {
            type: Boolean,
        },
    },
})
