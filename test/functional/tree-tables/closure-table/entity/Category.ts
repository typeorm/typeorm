import { Column, Entity, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent } from "@typeorm/core";

@Entity()
@Tree("closure-table")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @TreeParent()
    parentCategory: Category;

    @TreeChildren({cascade: true})
    childCategories: Category[];

    // @TreeLevelColumn()
    // level: number;

}
