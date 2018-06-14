import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src";

@Entity()
export class A {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", {nullable: true})
    data1?: string|null;

    @Column("varchar", {nullable: true})
    data2?: string|null;
}