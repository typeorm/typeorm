import {Column} from "../../../src/index";

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