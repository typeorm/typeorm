import { Column, PrimaryGeneratedColumn } from "@typeorm/core";

export class BasePost {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

}
