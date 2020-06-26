import { Column, Entity, OneToMany, PrimaryColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(type => Category, category => category.post)
    categories: Category[];

    constructor(id: number, title: string) {
        this.id = id;
        this.title = title;
    }

}
