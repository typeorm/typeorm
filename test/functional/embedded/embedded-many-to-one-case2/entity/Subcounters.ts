import { Column } from "@typeorm/core";

export class Subcounters {

    @Column()
    version: number;

    @Column()
    watches: number;

}
