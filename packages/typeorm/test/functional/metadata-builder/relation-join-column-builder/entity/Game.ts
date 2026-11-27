import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Game {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number

    @Column()
    title: string
}
