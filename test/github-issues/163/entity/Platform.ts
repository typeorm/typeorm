import {Table} from "../../../../src/decorator/tables/Table";
import {Index} from "../../../../src/decorator/Index";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {ManyToMany} from "../../../../src/decorator/relations/ManyToMany";
import {Game} from "./Game";

@Table("platforms")
@Index("platform_name_idx", ["name"], { unique: true })
export class Platform {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 100
    })
    name: string;

    @Column({
        length: 100
    })
    slug: string;

    @ManyToMany(type => Game, game => game.platforms, {
        cascadeInsert: true, // allow to insert a new game on platform save
        cascadeUpdate: true, // allow to update an game on platform save
        cascadeRemove: true  // allow to remove an game on platform remove
    })
    games: Game[];

}