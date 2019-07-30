import {Column} from "../../../../../../src/decorator/columns/Column";

export class Counters {

    @Column()
    likes: number;

    @Column()
    text: string;

    @Column()
    tags: string[];

    constructor(likes: number, text: string = "default text") {
        this.likes = likes;
        this.text = text;
        this.tags = [];
    }

}