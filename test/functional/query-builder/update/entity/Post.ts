import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../../src/decorator/relations/JoinColumn";
import {Student} from "./Student";

@Entity()
export class Post {

    @PrimaryColumn("binary")
    id: Buffer;

    @ManyToOne(type => Student)
    @JoinColumn()
    student: Student | null;

}
