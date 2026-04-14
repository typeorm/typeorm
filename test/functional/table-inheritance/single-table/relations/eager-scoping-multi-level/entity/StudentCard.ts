import { Column } from "../../../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class StudentCard {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    cardNumber: string
}
