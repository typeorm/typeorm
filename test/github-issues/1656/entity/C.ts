import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class C {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
