import { EntitySchema } from "../../../../../src/index"

export const createPostCountSchema = (materialized: boolean) =>
    new EntitySchema<any>({
        name: "PostCount",
        type: "view",
        materialized,
        expression: `SELECT COUNT("post"."id") AS "postCount" FROM "post" "post"`,
        columns: {
            postCount: {
                type: Number,
            },
        },
    })

export const PostCountSchema = createPostCountSchema(true)
