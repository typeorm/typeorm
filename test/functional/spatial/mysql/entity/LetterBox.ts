import { Entity, PrimaryGeneratedColumn } from "../../../../src"
import { Column } from "../../../../src/decorator/columns/Column"

@Entity()
export class LetterBox {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "point", srid: 4326 })
    coord: string
}
