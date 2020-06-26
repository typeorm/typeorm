import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity("sample30_post", {
    orderBy: {
        title: "ASC",
        id: "DESC"
    }
})
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

    constructor(title: string, text: string, categories: Category[]) {
        this.title = title;
        this.text = text;
        this.categories = categories;
    }

}
