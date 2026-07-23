import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { ManyToOne } from "../../../../src/decorator/relations/ManyToOne"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Sport } from "./Sport"

@Entity()
export class Player {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Sport, (sport) => sport.players)
    sport: Sport
}
