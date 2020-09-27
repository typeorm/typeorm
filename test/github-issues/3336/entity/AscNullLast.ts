import {Index, PrimaryColumn} from "../../../../src";
import {Column} from "../../../../src";
import {Entity} from "../../../../src";

@Entity()
export class AscNullLast {
    @PrimaryColumn()
    public id: number;

    @Column({ nullable: true })
    @Index({
        orderBy: {
            numberField: {
                nulls: "NULLS LAST",
                order: "ASC"
            }
        }
    })
    public numberField?: number;

    @Column({ nullable: true })
    @Index({
        orderBy: {
            dateField: {
                nulls: "NULLS LAST",
                order: "ASC"
            }
        }
    })
    public dateField?: Date;

    @Column({ nullable: true })
    @Index({
        orderBy: {
            stringField: {
                nulls: "NULLS LAST",
                order: "ASC"
            }
        }
    })
    public stringField?: string;
}
