import { Entity, PrimaryColumn, ManyToMany } from "../../../../../src"
import { Game } from "./Game"

@Entity()
export class Genre {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    name: string

    @ManyToMany(() => Game, (game) => game.genres)
    games: Game[]
}
