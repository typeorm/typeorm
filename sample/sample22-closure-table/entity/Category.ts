import {Column, PrimaryGeneratedColumn} from "../../../src/index";
import {TreeLevelColumn} from "../../../src/decorator/tree/TreeLevelColumn";
import {ClosureEntity} from "../../../src/decorator/entity/ClosureEntity";
import {TreeParent} from "../../../src/decorator/tree/TreeParent";
import {TreeChildren} from "../../../src/decorator/tree/TreeChildren";

@ClosureEntity("sample22_category")
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
    // @RelationsCountColumn()
    // categoriesCount: number;

}