import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Dummy {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    field: string
}
