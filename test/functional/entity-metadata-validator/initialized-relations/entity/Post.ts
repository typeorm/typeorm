import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => Category)
    @JoinColumn()
    category: Category;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[] = [];

}
