import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({default: "default value"})
    addedField: string;
}
