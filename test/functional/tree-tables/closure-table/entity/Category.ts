import {ClosureEntity} from "../../../../../src/decorator/entity/ClosureEntity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {TreeParent} from "../../../../../src/decorator/tree/TreeParent";
import {TreeChildren} from "../../../../../src/decorator/tree/TreeChildren";
import {TreeLevelColumn} from "../../../../../src/decorator/tree/TreeLevelColumn";

@ClosureEntity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
    
    @TreeParent({ cascade: true })
    parentCategory: Category;

    @TreeChildren({ cascade: true })
    childCategories: Category[];

    @TreeLevelColumn()
    level: number;

}