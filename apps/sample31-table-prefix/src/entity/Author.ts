import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity("sample31_author")
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}
