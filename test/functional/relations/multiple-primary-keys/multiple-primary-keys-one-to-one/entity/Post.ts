import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => Category, category => category.post)
    @JoinColumn()
    category: Category;

    @OneToOne(type => Category, category => category.postWithOptions)
    @JoinColumn([
        {name: "category_name", referencedColumnName: "name"},
        {name: "category_type", referencedColumnName: "type"}
    ])
    categoryWithOptions: Category;

    @OneToOne(type => Category, category => category.postWithNonPKColumns)
    @JoinColumn([
        {name: "category_code", referencedColumnName: "code"},
        {name: "category_version", referencedColumnName: "version"},
        {name: "category_description", referencedColumnName: "description"}
    ])
    categoryWithNonPKColumns: Category;

}
