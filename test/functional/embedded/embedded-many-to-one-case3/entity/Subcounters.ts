import { Column, PrimaryColumn } from "@typeorm/core";

export class Subcounters {

    @PrimaryColumn()
    version: number;

    @Column()
    watches: number;

}
