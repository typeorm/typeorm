import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Abbreviation {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
