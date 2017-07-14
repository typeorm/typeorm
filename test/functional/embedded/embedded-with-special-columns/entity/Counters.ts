import {Column} from "../../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../../src/decorator/Embedded";
import {CreateDateColumn} from "../../../../../src/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../../../src/decorator/columns/UpdateDateColumn";
import {Subcounters} from "./Subcounters";

export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Column(() => Subcounters)
    subcounters: Subcounters;

    @CreateDateColumn()
    createdDate: Date;

    @UpdateDateColumn()
    updatedDate: Date;

}