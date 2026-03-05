import { EntitySchema } from "../../../../src"

import { A } from "../entity"

export const ASchema = new EntitySchema<A>({
    target: A,
    name: "A",
    type: "entity-child",
    discriminatorValue: "custom-a",
    columns: {
        a: {
            type: Boolean,
        },
    },
})
