import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {BaseEntity} from "../../../../src/repository/BaseEntity";
import {ObjectID, ObjectIdColumn} from "../../../../src";

@Entity()
export class MongoPost extends BaseEntity {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    title: string;

    @Column()
    author: string;
}
