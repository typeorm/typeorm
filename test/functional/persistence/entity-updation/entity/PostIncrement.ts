import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class PostIncrement {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

}
