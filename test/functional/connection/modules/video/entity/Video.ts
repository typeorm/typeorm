import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Video {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
