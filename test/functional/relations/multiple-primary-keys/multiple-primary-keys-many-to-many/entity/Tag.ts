import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {ManyToMany} from "../../../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../src/decorator/relations/JoinTable";
import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Category} from "./Category";
import {Column} from "../../../../../../src/decorator/columns/Column";

@Entity()
export class Tag {

    @Column()
    code: number;

    @PrimaryColumn()
    title: string;

    @PrimaryColumn()
    description: string;

    @ManyToMany(type => Category, category => category.tags)
    @JoinTable()
    categories: Category[];

    @ManyToMany(type => Category, category => category.tagsWithOptions)
    @JoinTable({
        name: "tag_categories",
        joinColumns: [{
            name: "tagTitle",
            referencedColumnName: "title"
        }, {
            name: "tagDescription",
            referencedColumnName: "description"
        }],
        inverseJoinColumns: [{
            name: "categoryName",
            referencedColumnName: "name"
        }, {
            name: "categoryType",
            referencedColumnName: "type"
        }]
    })
    categoriesWithOptions: Category[];

    @ManyToMany(type => Category, category => category.tagsWithNonPrimaryColumns)
    @JoinTable({
        name: "tag_categories_non_primary",
        joinColumns: [{
            name: "tagTitle",
            referencedColumnName: "title"
        }, {
            name: "tagDescription",
            referencedColumnName: "description"
        }],
        inverseJoinColumns: [{
            name: "categoryCode",
            referencedColumnName: "code"
        }, {
            name: "categoryVersion",
            referencedColumnName: "version"
        }, {
            name: "categoryDescription",
            referencedColumnName: "description"
        }]
    })
    categoriesWithNonPrimaryColumns: Category[];

}