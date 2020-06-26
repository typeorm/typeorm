import { Column, Entity, Index, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index()
    username: string;

}
