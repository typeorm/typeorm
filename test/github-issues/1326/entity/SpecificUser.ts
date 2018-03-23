import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src/index";

@Entity("user", { database: "db_2" })
export class SpecificUser {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}