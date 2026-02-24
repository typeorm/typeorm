import { Column } from "../../../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class StudentSettings {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    theme: string
}
