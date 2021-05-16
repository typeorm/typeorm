import {Entity, PrimaryColumn, PrimaryGeneratedColumn} from "../../../../src";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @PrimaryColumn()
    name: string;

}