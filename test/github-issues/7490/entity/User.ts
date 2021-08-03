import {Column,JoinColumn, Entity, PrimaryGeneratedColumn, OneToOne} from "../../../../src";
import { Image } from "./Image";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(() => Image)
    @JoinColumn()
    picture: Image;
}
