import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Question {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToMany(type => Category, {persistence: false})
    @JoinTable()
    categories: Category[] = [];

}
