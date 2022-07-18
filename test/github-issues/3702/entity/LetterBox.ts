import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class LetterBox {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "point", srid: 4326 })
    coord: string
}
