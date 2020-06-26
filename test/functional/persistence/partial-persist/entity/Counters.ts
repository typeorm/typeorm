import { Column } from "@typeorm/core";

export class Counters {

    @Column()
    stars: number;

    @Column()
    commentCount: number;

    @Column()
    metadata: string;

}
