import {Index, PrimaryColumn} from "../../../../src";
import {Column} from "../../../../src";
import {Entity} from "../../../../src";

@Entity()
export class DescNullLast {
    @PrimaryColumn()
    public id: number;

    @Column({ nullable: true })
    @Index({
        orderBy: {
            numberField: {
                nulls: "NULLS LAST",
                order: "DESC"
            }
        }
    })
    public numberField?: number;

    @Column({ nullable: true })
    @Index({
        orderBy: {
            dateField: {
                nulls: "NULLS LAST",
                order: "DESC"
            }
        }
    })
    public dateField?: Date;

    @Column({ nullable: true })
    @Index({
        orderBy: {
            stringField: {
                nulls: "NULLS LAST",
                order: "DESC"
            }
        }
    })
    public stringField?: string;
}
