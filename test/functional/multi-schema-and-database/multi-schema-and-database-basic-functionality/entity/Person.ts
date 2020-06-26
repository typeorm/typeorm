import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity({database: "secondDB"})
export class Person {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
