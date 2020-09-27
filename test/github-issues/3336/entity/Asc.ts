import {Index, PrimaryColumn} from "../../../../src";
import {Column} from "../../../../src";
import {Entity} from "../../../../src";

@Entity()
export class Asc {
    @PrimaryColumn()
    public id: number;

    @Column()
    @Index({
        orderBy: "ASC"
    })
    public numberField!: number;

    @Column()
    @Index({
        orderBy: "ASC"
    })
    public dateField!: Date;

    @Column()
    @Index({
        orderBy: "ASC"
    })
    public stringField!: string;
}
