import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { WrappedNumber, transformer } from "../transformer"

@Entity()
export class Dummy {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: Number, transformer })
    num: WrappedNumber
}
