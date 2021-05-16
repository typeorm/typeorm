import {Column, Entity, PrimaryGeneratedColumn} from "../../../src/index";
import {Counters} from "./Counters";

@Entity("sample26_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;
    
    @Column(type => Counters)
    counters: Counters;

}