import {Index, PrimaryColumn} from "../../../../src";
import {Column} from "../../../../src";
import {Entity} from "../../../../src";

@Entity()
export class Desc {
    @PrimaryColumn()
    public id: number;

    @Column()
    @Index({
        orderBy: "DESC"
    })
    public numberField!: number;

    @Column()
    @Index({
        orderBy: "DESC"
    })
    public dateField!: Date;

    @Column()
    @Index({
        orderBy: "DESC"
    })
    public stringField!: string;
}
