import {Column} from "../../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../../src/decorator/Embedded";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";
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

    @OneToMany(type => User, user => user.likedPost)
    likedUsers: User[];

}