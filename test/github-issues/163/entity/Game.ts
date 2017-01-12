import {Table} from "../../../../src/decorator/tables/Table";
import {Index} from "../../../../src/decorator/Index";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {ManyToMany} from "../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../src/decorator/relations/JoinTable";
import {Platform} from "./Platform";

@Table("games")
@Index("game_name_idx", ["name"], { unique: true })
export class Game {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 80
    })
    name: string;

    @Column({
        name: "search_terms",
        length: 80
    })
    searchTerms: string;

    @Column({
        name: "reviewed"
    })
    isReviewed: boolean;

    @ManyToMany(type => Platform, platform => platform.games, {
        cascadeInsert: true, // allow to insert a new platform on game save
        cascadeUpdate: true, // allow to update a platform on game save
        cascadeRemove: true  // allow to remove a platform on game remove
    })
    @JoinTable()
    platforms: Platform[];

}