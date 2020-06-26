import { Column, PrimaryGeneratedColumn } from "@typeorm/core";

export class Unit {

    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    type: string;

}
