import {PrimaryGeneratedColumn, Column, Entity} from "../../../src/index";
import {CreateDateColumn} from "../../../src/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../src/decorator/columns/UpdateDateColumn";

@Entity("sample11_everything_entity")
export class EverythingEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column("text")
    text: string;

    @Column({ length: "32" })
    shortTextColumn: string;

    @Column()
    numberColumn: number;

    @Column("integer")
    integerColumn: number;

    @Column("int")
    intColumn: number;

    @Column("smallint")
    smallintColumn: number;

    @Column("bigint")
    bigintColumn: number;

    @Column("float")
    floatColumn: number;

    @Column("double")
    doubleColumn: number;

    @Column("decimal")
    decimalColumn: number;

    @Column()
    date: Date;

    @Column("date")
    dateColumn: Date;

    @Column("time")
    timeColumn: Date;

    @Column("boolean")
    isBooleanColumn: boolean;

    @Column("boolean")
    isSecondBooleanColumn: boolean;

    @Column("json")
    jsonColumn: any;

    @Column()
    alsoJson: any;

    @Column("simple_array")
    simpleArrayColumn: string[];

    @CreateDateColumn()
    createdDate: Date;

    @UpdateDateColumn()
    updatedDate: Date;

}