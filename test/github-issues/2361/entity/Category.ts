import { Entity, Tree, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent } from "../../../../src";
import { JoinColumn } from "../../../../src/decorator/relations/JoinColumn";

@Entity({
    name: "Category"
})
@Tree("closure-table")
export class Category {
    @PrimaryGeneratedColumn("uuid")
    custom_id: string;

    @Column()
    name: string;

    @TreeChildren()
    children: Category[];

    @TreeParent()
    @JoinColumn({
        name: "parent_id"
    })
    parent: Category;
}
