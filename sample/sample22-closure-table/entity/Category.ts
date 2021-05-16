import {Column, PrimaryGeneratedColumn} from "../../../src/index";
import {TreeLevelColumn} from "../../../src/decorator/tree/TreeLevelColumn";
import {TreeParent} from "../../../src/decorator/tree/TreeParent";
import {TreeChildren} from "../../../src/decorator/tree/TreeChildren";
import {Tree} from "../../../src/decorator/tree/Tree";
import {Entity} from "../../../src/decorator/entity/Entity";

@Entity("sample22_category")
@Tree("closure-table")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
    
    @TreeParent()
    parentCategory: Category;

    @TreeChildren({ cascade: true })
    childCategories: Category[];

    @TreeLevelColumn()
    level: number;

    // todo:
    // @TreeChildrenCount()
    // categoriesCount: number;

}