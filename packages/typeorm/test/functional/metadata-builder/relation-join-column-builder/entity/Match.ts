import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Game } from "./Game"
import { Participant } from "./Participant"

@Entity()
export class Match {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number

    @JoinColumn({ name: "game_id", referencedColumnName: "id" })
    @ManyToOne(() => Game, (game) => game.id, { eager: true })
    game: Game

    @Column({ name: "user_id", type: "int", nullable: false })
    userId: number

    @JoinColumn([
        { name: "user_id", referencedColumnName: "userId" },
        { name: "game_id", referencedColumnName: "gameId" },
    ])
    @ManyToOne(() => Participant, { eager: true })
    participant: Participant | null = null
}
