import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Person {

    @PrimaryGeneratedColumn()
    Id: number;

    @Column({
        unique: true
    })
    Name: string;

}
