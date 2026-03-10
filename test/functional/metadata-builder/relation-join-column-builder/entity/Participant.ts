import { Entity, Index, PrimaryColumn } from "../../../../../src"

@Entity()
export class Participant {
    @PrimaryColumn({ name: "user_id", type: "int", nullable: false })
    @Index()
    userId: number

    @PrimaryColumn({ name: "game_id", type: "int", nullable: false })
    @Index()
    gameId: number
}
