import { Column } from "@typeorm/core";

export class Counters {

    @Column()
    raiting: number;

    @Column()
    stars: number;

    @Column()
    commentCount: number;

    @Column()
    metadata: string;

}
