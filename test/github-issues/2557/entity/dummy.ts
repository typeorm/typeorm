import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";
import { transformer, WrappedNumber } from "../transformer";

@Entity()
export class Dummy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", {transformer})
    num: WrappedNumber;
}
