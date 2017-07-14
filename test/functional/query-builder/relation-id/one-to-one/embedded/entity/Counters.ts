import {Column} from "../../../../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../../../../src/decorator/Embedded";
import {Category} from "./Category";
import {Subcounters} from "./Subcounters";
import {OneToOne} from "../../../../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../../src/decorator/relations/JoinColumn";

export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @OneToOne(type => Category, category => category.post)
    @JoinColumn()
    category: Category;

    @Column(() => Subcounters)
    subcounters: Subcounters;

    categoryId: number;

}