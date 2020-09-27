import {Index, PrimaryColumn} from "../../../../src";
import {Column} from "../../../../src";
import {Entity} from "../../../../src";

@Entity()
@Index(["numberField", "dateField", "stringField"],{
    orderBy: "ASC"
})
export class MultipleString {
    @PrimaryColumn()
    public id: number;

    @Column()
    public numberField!: number;

    @Column()
    public dateField!: Date;

    @Column()
    public stringField!: string;
}
