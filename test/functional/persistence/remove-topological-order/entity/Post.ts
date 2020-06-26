import { Category } from "./Category";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(type => Category, category => category.post, {cascade: ["insert"]})
    categories: Category[];

}
