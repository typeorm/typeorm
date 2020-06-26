import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";
import { Counters } from "./Counters";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column(() => Counters)
    counters: Counters;

}
