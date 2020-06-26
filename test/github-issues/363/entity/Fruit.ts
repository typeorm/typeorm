import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Fruit {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
