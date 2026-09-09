import { Column, JoinTable, ManyToMany } from "../../../../../../src"
import { Category } from "./Category"

export class BookMeta {
    @Column({ nullable: true })
    note: string

    @JoinTable({
        name: "BookMetaCategories",
    })
    @ManyToMany(() => Category)
    categories: Category[]
}
