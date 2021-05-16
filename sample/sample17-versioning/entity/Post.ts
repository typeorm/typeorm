import {Column, Entity, PrimaryGeneratedColumn} from "../../../src/index";
import {VersionColumn} from "../../../src/decorator/columns/VersionColumn";

@Entity("sample17_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @VersionColumn()
    version: number;
    
}