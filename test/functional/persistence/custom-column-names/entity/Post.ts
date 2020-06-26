import { Category } from "./Category";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column("int", {nullable: true})
    categoryId: number;

    @ManyToOne(type => Category, category => category.posts, {
        cascade: true
    })
    @JoinColumn({name: "categoryId"})
    category: Category;

}
