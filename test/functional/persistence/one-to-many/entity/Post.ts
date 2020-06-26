import { Category } from "./Category";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Category, category => category.post)
    categories: Category[] | null;

    @Column({
        default: "supervalue"
    })
    title: string;

}
