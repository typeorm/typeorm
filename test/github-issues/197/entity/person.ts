import { Column, Entity, Index, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Person {

    @PrimaryGeneratedColumn()
    id: number;

    @Index({
        unique: true
    })
    @Column()
    firstname: string;

    @Column()
    lastname: string;
}
