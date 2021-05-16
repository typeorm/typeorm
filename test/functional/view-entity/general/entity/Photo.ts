import {Entity} from "../../../../../src";
import {Column} from "../../../../../src";
import {PrimaryGeneratedColumn} from "../../../../../src";
import {ManyToOne} from "../../../../../src";
import {JoinColumn} from "../../../../../src";
import {Album} from "./Album";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    albumId: number;

    @ManyToOne(() => Album)
    @JoinColumn({ name: "albumId" })
    album: Album;

}
