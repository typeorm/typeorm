import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity("Tags")
export class Tag {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    a: string;

    @Column()
    b: string;

    @Column()
    c: string;
}
