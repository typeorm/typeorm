import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Simple {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    x: number;

}
