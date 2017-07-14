import {Column} from "../../../../../src/decorator/columns/Column";
import {JoinColumn} from "../../../../../src/decorator/relations/JoinColumn";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Embedded} from "../../../../../src/decorator/Embedded";
import {User} from "./User";
import {Subcounters} from "./Subcounters";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";

export class Counters {

    @PrimaryColumn()
    code: number;

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Column(() => Subcounters)
    subcounters: Subcounters;

    @ManyToOne(type => User)
    @JoinColumn()
    likedUser: User;

}