import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"
import { Sport } from "./Sport"

@Entity()
export class Player {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    sportId: number

    @ManyToOne(() => Sport, (sport) => sport.players)
    @JoinColumn({ name: "sportId", referencedColumnName: "id" })
    sport: Sport
}
