import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity("join_1288")
export class JoinEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    spec: string;
}