import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    date: Date;

}
