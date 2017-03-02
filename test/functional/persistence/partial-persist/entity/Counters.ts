import {EmbeddableEntity} from "../../../../../src/decorator/entity/EmbeddableEntity";
import {Column} from "../../../../../src/decorator/columns/Column";

@EmbeddableEntity()
export class Counters {

    @Column()
    stars: number;

    @Column()
    commentCount: number;

    @Column()
    metadata: string;

}