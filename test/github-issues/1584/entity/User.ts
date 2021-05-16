import {Entity} from "../../../../src/decorator/entity/Entity";
import {ObjectIdColumn} from "../../../../src/decorator/columns/ObjectIdColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {ObjectID} from "../../../../src/driver/mongodb/typings";

@Entity()
export class User {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    name: string;

}