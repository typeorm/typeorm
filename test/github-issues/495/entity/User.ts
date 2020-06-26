import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    userId: number;

    @Column()
    name: string;

}
