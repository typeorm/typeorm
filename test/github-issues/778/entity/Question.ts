import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Question {

    @PrimaryGeneratedColumn({type: "smallint"})
    id: number;

    @Column()
    name: string;

}
