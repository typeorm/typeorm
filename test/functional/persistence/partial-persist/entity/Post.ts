import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from "@typeorm/core";
import { Category } from "./Category";
import { Counters } from "./Counters";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column(type => Counters)
    counters: Counters;

    @ManyToMany(type => Category, category => category.posts, {
        cascade: ["update"],
    })
    @JoinTable()
    categories: Category[];

}
