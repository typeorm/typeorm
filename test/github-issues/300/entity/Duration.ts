import {Column} from "../../../../src/decorator/columns/Column";
import {EmbeddableEntity} from "../../../../src/decorator/entity/EmbeddableEntity";

@EmbeddableEntity()
export class Duration {

    @Column({ nullable: true })
    minutes: number;

    @Column({ nullable: true })
    hours: number;

    @Column({ nullable: true })
    days: number;

}