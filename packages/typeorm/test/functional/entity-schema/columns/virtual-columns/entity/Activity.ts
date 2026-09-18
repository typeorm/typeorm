import { EntitySchema } from "../../../../../../src"

export const Activity = new EntitySchema({
    name: "activities",
    columns: {
        id: {
            primary: true,
            generated: "increment",
            type: "int",
            unsigned: true,
        },
        k1: {
            type: "int",
        },
        vK1: {
            type: "int",
            virtualProperty: true,
            query: (alias) =>
                `SELECT k1 FROM "activities" WHERE "k1" = ${alias}."k1"`,
        },
    },
})
