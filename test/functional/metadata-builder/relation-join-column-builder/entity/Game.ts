import { Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Game {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number
}
