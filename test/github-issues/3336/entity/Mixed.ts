import {Index, PrimaryColumn} from "../../../../src";
import {Column} from "../../../../src";
import {Entity} from "../../../../src";

@Entity()
export class Mixed {
    @PrimaryColumn()
    public id: number;

    @Column()
    @Index({
        orderBy: "ASC"
    })
    public numberField!: number;

    @Column()
    @Index({
        orderBy: "DESC"
    })
    public dateField!: Date;

    @Column({ nullable: true })
    @Index({
        orderBy: {
            stringField: {
                nulls: "NULLS FIRST",
                order: "ASC"
            }
        }
    })
    public stringField?: string;
}
