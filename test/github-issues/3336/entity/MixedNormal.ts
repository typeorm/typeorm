import {Index, PrimaryColumn} from "../../../../src";
import {Column} from "../../../../src";
import {Entity} from "../../../../src";

@Entity()
export class MixedNormal {
    @PrimaryColumn()
    public id: number;

    @Column()
    public numberField!: number;

    @Column()
    @Index()
    public dateField!: Date;

    @Column()
    @Index({
        orderBy: "ASC"
    })
    public stringField!: string;
}
