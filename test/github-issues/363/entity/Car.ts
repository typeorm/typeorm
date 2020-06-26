import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Car {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
