import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity("user", {database: "db_2"})
export class SpecificUser {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
