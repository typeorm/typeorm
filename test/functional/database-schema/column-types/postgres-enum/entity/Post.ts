import {Column} from "../../../../../../src/decorator/columns/Column";
import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("enum", { enum: ["A", "B", "C"] })
    enum: string;

    @Column("enum", { enum: ["A", "B", "C"], array: true })
    enumArray: string[];

    @Column("simple-enum", { enum: ["A", "B", "C"] })
    simpleEnum: string;

    @Column()
    name: string;
}
