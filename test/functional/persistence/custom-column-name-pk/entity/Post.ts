import { Column, Entity, Generated, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryColumn({name: "theId"})
    @Generated()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Category, category => category.posts, {
        cascade: ["insert"]
    })
    category: Category;

}
