import {Index, PrimaryColumn} from "../../../../src";
import {Column} from "../../../../src";
import {Entity} from "../../../../src";

@Entity()
@Index(["numberField", "dateField", "stringField"],{
    orderBy: {
        numberField: {
            order: "ASC"
        },
        dateField: "DESC",
        stringField: {
            order: "DESC",
            nulls: "NULLS LAST"
        }
    }
})
export class Multiple {
    @PrimaryColumn()
    public id: number;

    @Column()
    public numberField!: number;

    @Column()
    public dateField!: Date;

    @Column()
    public stringField!: string;
}
