import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity({
    schema: "yoman"
})
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Category)
    @JoinTable({schema: "yoman"})
    categories: Category[];

}
