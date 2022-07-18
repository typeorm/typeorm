import { Entity } from "typeorm/decorator/entity/Entity"
import { Index } from "typeorm/decorator/Index"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Game } from "./Game"

@Entity("platforms")
@Index("platform_name_idx", ["name"], { unique: true })
export class Platform {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 100,
    })
    name: string

    @Column({
        length: 100,
    })
    slug: string

    @ManyToMany((type) => Game, (game) => game.platforms)
    games: Game[]
}
