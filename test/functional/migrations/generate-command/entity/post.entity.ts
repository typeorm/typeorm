import { BaseEntity, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./category.entity";

@Entity("post_test", {schema: "public"})
export class Post extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({
        default: "This is default text."
    })
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

}
