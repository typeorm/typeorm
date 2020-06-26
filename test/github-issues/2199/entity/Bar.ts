import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity("bar")
export class Bar {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    description: string;
}
