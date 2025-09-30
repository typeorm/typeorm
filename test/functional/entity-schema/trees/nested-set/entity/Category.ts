import { EntitySchema } from "../../../../../../src"

export const Category = new EntitySchema<{
    id: number
    name: string
    parentCategory: any
    childCategories: any[]
}>({
    name: "Category",
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
    relations: {
        parentCategory: {
            type: "many-to-one",
            treeParent: true,
            target: "Category",
        },
        childCategories: {
            type: "one-to-many",
            treeChildren: true,
            target: "Category",
            cascade: true,
        },
    },
    trees: [{ type: "nested-set" }],
})
