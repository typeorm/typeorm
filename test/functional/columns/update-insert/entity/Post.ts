import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column({update: false, default: "Default"})
    authorFirstName: string;

    @Column({insert: false, default: "Default"})
    authorMiddleName: string;

    @Column({insert: false, update: false, default: "Default"})
    authorLastName: string;
}
