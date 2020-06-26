import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity("sample19_author")
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
