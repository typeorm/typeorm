import {EmbeddableEntity} from "../../../../../../src/decorator/entity/EmbeddableEntity";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../../../src/decorator/Embedded";
import {Information} from "./Information";

@EmbeddableEntity()
export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Embedded(type => Information)
    information: Information;

}