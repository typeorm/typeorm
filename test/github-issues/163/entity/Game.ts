import { Entity } from "typeorm/decorator/entity/Entity"
import { Index } from "typeorm/decorator/Index"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { Platform } from "./Platform"

@Entity("games")
@Index("game_name_idx", ["name"], { unique: true })
export class Game {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 80,
    })
    name: string

    @Column({
        name: "search_terms",
        length: 80,
    })
    searchTerms: string

    @Column({
        name: "reviewed",
    })
    isReviewed: boolean

    @ManyToMany((type) => Platform, (platform) => platform.games, {
        cascade: true,
    })
    @JoinTable()
    platforms: Platform[]
}
