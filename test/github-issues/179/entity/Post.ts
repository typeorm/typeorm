import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {CreateDateColumn} from "../../../../src/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../../src/decorator/columns/UpdateDateColumn";
import {ColumnTypes} from "../../../../src/metadata/types/ColumnTypes";

@Table()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column(ColumnTypes.TIME)
    timeOnly: Date|string|number;

    @Column(ColumnTypes.TIME, { storeInLocalTimezone: true, loadInLocalTimezone: true })
    localTimeOnly: Date|string|number;

    @Column(ColumnTypes.DATE)
    dateOnly: Date|string|number;

    @Column(ColumnTypes.DATE, { storeInLocalTimezone: true, loadInLocalTimezone: true })
    localDateOnly: Date|string|number;

    @Column(ColumnTypes.DATETIME)
    dateTime: Date|string|number;

    @Column(ColumnTypes.DATETIME, { storeInLocalTimezone: true, loadInLocalTimezone: true })
    localDateTime: Date|string|number;

    @CreateDateColumn()
    createdAt: Date|string|number;

    @UpdateDateColumn()
    updatedAt: Date|string|number;

}