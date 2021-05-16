import { PrimaryGeneratedColumn, Entity, Column, CreateDateColumn } from "../../../../src";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    title: string;

    @CreateDateColumn()
    readonly createdAt?: Date;
}
