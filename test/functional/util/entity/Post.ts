import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {ManyToOne} from "../../../../src/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../src/decorator/relations/JoinColumn";
import {Counters} from "./Counters";

@Entity()
export class Post {

    @PrimaryColumn("binary", {
        length: 1
    })
    id: Buffer;

    @ManyToOne(type => Counters)
    @JoinColumn()
    counters: Counters | null;

}
