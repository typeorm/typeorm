import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Tag {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    name: string;

}
