import {
    Entity,
    PrimaryColumn,
    ManyToMany,
    JoinTable,
} from "../../../../../src"
import { Genre } from "./Genre"

@Entity()
export class Game {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    name: string

    @ManyToMany(() => Genre, (genre) => genre.games, {
        eager: true,
        cascade: true,
    })
    @JoinTable()
    genres: Genre[]
}
