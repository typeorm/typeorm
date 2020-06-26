import { Column, Entity, PrimaryGeneratedColumn, Tree, TreeChildren, TreeLevelColumn, TreeParent } from "@typeorm/core";

@Entity("sample22_category")
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

    @TreeLevelColumn()
    level: number;

    // todo:
    // @TreeChildrenCount()
    // categoriesCount: number;

}
