import { EntitySchema } from "../../../../../src"

export const UserEntity = new EntitySchema({
    name: "User",
    tableName: "user",
    columns: {
        id: {
            type: Number,
            primary: true,
        },
        firstName: {
            type: "varchar",
            nullable: false,
        },
        secondName: {
            type: "varchar",
            nullable: false,
        },
    },
})
