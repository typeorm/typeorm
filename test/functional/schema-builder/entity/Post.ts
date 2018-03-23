import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {Unique} from "../../../../src/decorator/Unique";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Check} from "../../../../src/decorator/Check";

@Entity()
@Unique(["text", "tag"])
@Check(`"likesCount" < 1000`)
export class Post {

    @PrimaryColumn()
    id: number;

    @Column({ unique: true })
    version: string;

    @Column({ default: "My post" })
    name: string;

    @Column()
    text: string;

    @Column()
    tag: string;

    @Column()
    likesCount: number;

}