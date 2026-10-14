import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { OneToMany } from "../../../../../src/decorator/relations/OneToMany"
import { Player } from "./Player"

@Entity()
export class Sport {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Player, (player) => player.sport)
    players: Player[]
}
