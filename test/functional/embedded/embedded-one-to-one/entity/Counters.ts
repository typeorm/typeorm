import {Column} from "../../../../../src/decorator/columns/Column";
import {JoinColumn} from "../../../../../src/decorator/relations/JoinColumn";
import {Embedded} from "../../../../../src/decorator/Embedded";
import {OneToOne} from "../../../../../src/decorator/relations/OneToOne";
import {User} from "./User";
import {Subcounters} from "./Subcounters";

export class Counters {

    @Column()
    code: number;

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Column(() => Subcounters)
    subcounters: Subcounters;

    @OneToOne(type => User)
    @JoinColumn()
    likedUser: User;

}