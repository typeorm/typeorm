import {ObjectIdColumn} from "../../../../../src/decorator/columns/ObjectIdColumn";
import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Generated} from "../../../../../src/decorator/Generated";

@Entity()
export class Post {

    @ObjectIdColumn()
    id: number;

    @Column()
    @Generated("uuid")
    uuid: string;

}