import {Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from "../../../../src";
import {Photo} from "./Photo";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Photo)
    @JoinTable()
    photos: Photo[];

}