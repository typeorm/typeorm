import { Column, Entity, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Platform } from "./Platform";

@Entity("games")
@Index("game_name_idx", ["name"], {unique: true})
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
        cascade: true
    })
    @JoinTable()
    platforms: Platform[];

}
