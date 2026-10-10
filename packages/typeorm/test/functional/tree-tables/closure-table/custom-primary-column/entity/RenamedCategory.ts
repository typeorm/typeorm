import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Tree,
    TreeChildren,
    TreeParent,
} from "../../../../../../src"

@Entity()
@Tree("closure-table")
export class RenamedCategory {
    @PrimaryGeneratedColumn({ name: "category_id" })
    cat_id: number

    @Column()
    cat_name: string

    @TreeParent()
    parent: RenamedCategory | null

    @TreeChildren()
    children: RenamedCategory[]
}
