import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class A {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
