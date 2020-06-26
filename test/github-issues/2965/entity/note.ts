import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Person } from "./person";

@Entity()
export class Note {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public label: string;

    @ManyToOne(type => Person, {lazy: true})
    public owner: Promise<Person> | Person;
}
