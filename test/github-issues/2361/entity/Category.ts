import { Entity, Tree, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent } from "../../../../src";

@Entity({
    name: "Category"
})
@Tree("closure-table")
export class Category {
    @PrimaryGeneratedColumn()
    customId: number;

    @Column()
    name: string;

    @TreeChildren()
    children: Category[];

    @TreeParent()
    parent: Category;
}
