import { Column, JoinColumn, OneToOne, PrimaryColumn } from "@typeorm/core";
import { Category } from "./Category";
import { Subcounters } from "./Subcounters";

export class Counters {

    @PrimaryColumn()
    code: number;

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @OneToOne(type => Category)
    @JoinColumn()
    category: Category;

    @Column(() => Subcounters)
    subcounters: Subcounters;

    categoryId: number[];

}
