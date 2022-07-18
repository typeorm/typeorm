import { Column } from "typeorm/decorator/columns/Column"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

export const DEFAULT_VALUE = "default-value"

@Entity()
export class Test {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: DEFAULT_VALUE })
    value: string
}
