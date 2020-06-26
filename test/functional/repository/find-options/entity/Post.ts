import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";
import { User } from "./User";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => User)
    author: User;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

}
