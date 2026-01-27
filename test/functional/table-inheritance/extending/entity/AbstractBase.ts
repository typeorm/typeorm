import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

export abstract class AbstractBase {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string
}
