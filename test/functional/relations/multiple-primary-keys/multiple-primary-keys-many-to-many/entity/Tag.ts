import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from "@typeorm/core";
import { Category } from "./Category";

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

    @ManyToMany(type => Category, category => category.tagsWithNonPKColumns)
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
    categoriesWithNonPKColumns: Category[];

}
