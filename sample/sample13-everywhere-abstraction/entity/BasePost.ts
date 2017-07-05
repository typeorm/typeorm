import {PrimaryGeneratedColumn, Column} from "../../../src/index";

export class BasePost {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    title2312312: string;

}