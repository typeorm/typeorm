import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { OneToMany } from "../../../../src/decorator/relations/OneToMany"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
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
