import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../../../src/decorator/Embedded";
import {ObjectID} from "mongodb";
import {ObjectIdColumn} from "../../../../../../src/decorator/columns/ObjectIdColumn";

@Entity()
export class Post {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    title: string;

    @Column()
    text: string;

    // @Embedded(() => Counters)
    // counters: Counters;

}