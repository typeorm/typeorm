import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";
import { User } from "./User";
import { Photo } from "./Photo";
import { Counters } from "./Counters";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(type => Photo, photo => photo.post)
    photos: Photo[];

    @ManyToOne(type => User)
    user: User;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

    @Column(type => Counters)
    counters: Counters;

}
