import {Column} from "../../../../src/decorator/columns/Column";

export class Duration {

    @Column({ nullable: true })
    minutes: number|null;

    @Column({ nullable: true })
    hours: number|null;

    @Column({ nullable: true })
    days: number|null;

}