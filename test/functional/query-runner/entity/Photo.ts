import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {Unique} from "../../../../src/decorator/Unique";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Index} from "../../../../src/decorator/Index";

@Entity()
@Unique(["name"])
@Index(["text"], { unique: true })
export class Photo {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    @Index({ unique: true })
    tag: string;

    @Column({ unique: true })
    description: string;

    @Column()
    text: string;

}