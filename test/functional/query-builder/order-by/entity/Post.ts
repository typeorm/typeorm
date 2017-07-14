import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";

@Entity({
    orderBy: {
        myOrder: "DESC"
    }
})
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("int")
    myOrder: number;
}