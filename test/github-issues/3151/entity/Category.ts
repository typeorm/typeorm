import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Note } from "./Note";

@Entity()
export class Category {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @ManyToMany((type) => Note, (note) => note.categories)
    notes: Note[];
}
