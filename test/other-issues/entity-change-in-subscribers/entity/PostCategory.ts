import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class PostCategory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
