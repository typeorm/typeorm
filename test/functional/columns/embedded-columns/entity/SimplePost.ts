import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";
import { SimpleCounters } from "./SimpleCounters";

@Entity()
export class SimplePost {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column(type => SimpleCounters)
    counters: SimpleCounters;
}
