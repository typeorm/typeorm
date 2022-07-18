import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Tree,
    TreeParent,
    TreeChildren,
} from "typeorm"

@Entity()
@Tree("closure-table")
export class Category {
    @PrimaryGeneratedColumn()
    cat_id: number

    @Column()
    cat_name: string

    @TreeParent()
    parent: Category

    @TreeChildren({ cascade: true })
    children: Category[]
}
