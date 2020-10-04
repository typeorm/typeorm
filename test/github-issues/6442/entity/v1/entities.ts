import { PrimaryColumn, Generated, Column, Entity } from "../../../../../src";

@Entity()
export class FooEntity {
    @PrimaryColumn({ type: "int", width: 10, unsigned: true, nullable: false })
    @Generated()
    public id: number;
}

@Entity()
export class BarEntity {
    @PrimaryColumn({ type: "int", width: 10, unsigned: true })
    @Generated()
    public id: number;

    @Column("varchar", { nullable: false, length: 50 })
    public code: string;
}
