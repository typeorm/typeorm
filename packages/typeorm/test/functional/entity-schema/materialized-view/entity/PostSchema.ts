import { EntitySchema } from "../../../../../src/index"

export const PostSchema = new EntitySchema<any>({
    name: "Post",
    columns: {
        id: {
            primary: true,
            type: Number,
            generated: "increment",
        },
        name: {
            type: String,
        },
    },
})
