import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Project {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    name: string;
}
