import {EmbeddableEntity} from "../../../../../../src/decorator/entity/EmbeddableEntity";
import {Column} from "../../../../../../src/decorator/columns/Column";

@EmbeddableEntity()
export class Counters {

    @Column()
    likes: number;

    @Column()
    text: string;

    constructor(likes: number, text: string) {
        this.likes = likes;
        this.text = text;
    }

}