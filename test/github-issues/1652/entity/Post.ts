import { Entity, PrimaryColumn, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @PrimaryColumn()
    name: string;

}
