import { EntitySchema } from "../../../src"
import type { User } from "../model/user"

export const UserEntity = new EntitySchema<User>({
    name: "User",
    tableName: "users",
    columns: {
        id: {
            primary: true,
            type: Number,
            name: "ref",
        },
        uuid: {
            type: "uuid",
            unique: true,
        },
    },
})
