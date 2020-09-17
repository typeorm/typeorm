import { Column, Entity, PrimaryColumn } from "../../../../src";

@Entity()
export class Test {
    @PrimaryColumn()
    id: number;

    @Column({ type: 'int', unsigned: true})
    uInt: number;

    @Column({ type: 'tinyint', unsigned: true})
    uTinyInt: number;

    @Column({ type: 'smallint', unsigned: true})
    uSmallInt: number;

    @Column({ type: 'mediumint', unsigned: true})
    uMediumInt: number;

    @Column({ type: 'bigint', unsigned: true})
    uBigInt: number;
}
