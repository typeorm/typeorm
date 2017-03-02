import {EmbeddableEntity} from "../../../../../../src/decorator/entity/EmbeddableEntity";
import {Column} from "../../../../../../src/decorator/columns/Column";

@EmbeddableEntity()
export class Information {

    @Column()
    description: string;

}