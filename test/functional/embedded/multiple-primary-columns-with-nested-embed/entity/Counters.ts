import { Column, PrimaryColumn } from "@typeorm/core";
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

    @Column(() => Subcounters, {prefix: "subcnt"})
    subcounters: Subcounters;

}
