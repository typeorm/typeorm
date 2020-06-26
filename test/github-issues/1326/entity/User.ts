import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity({database: "db_1"})
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
