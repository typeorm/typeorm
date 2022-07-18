import { EntitySchema } from "typeorm"
import { Category } from "../model/Category"

export const CategoryEntity = new EntitySchema<Category>({
    name: "category",
    columns: {
        id: {
            type: Number,
            primary: true,
        },
        name: {
            type: String,
        },
    },
})
