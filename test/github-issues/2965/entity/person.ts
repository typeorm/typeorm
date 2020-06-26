import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Note } from "./note";

@Entity()
export class Person {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @OneToMany(type => Note, note => note.owner, {lazy: true})
    public notes: Promise<Note[]> | Note[];
}
