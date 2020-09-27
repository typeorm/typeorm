import {Index, PrimaryColumn} from "../../../../src";
import {Column} from "../../../../src";
import {Entity} from "../../../../src";

@Entity()
export class AscNullFirst {
    @PrimaryColumn()
    public id: number;

    @Column({ nullable: true })
    @Index({
        orderBy: {
            numberField: {
                nulls: "NULLS FIRST",
                order: "ASC"
            }
        }
    })
    public numberField?: number;

    @Column({ nullable: true })
    @Index({
        orderBy: {
            dateField: {
                nulls: "NULLS FIRST",
                order: "ASC"
            }
        }
    })
    public dateField?: Date;

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
