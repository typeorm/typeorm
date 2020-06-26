import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Profile {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    about: string;

}
