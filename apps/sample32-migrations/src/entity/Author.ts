import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}
