import { Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

}
