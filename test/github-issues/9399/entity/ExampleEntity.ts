import { Entity, Generated } from "../../../../src"
import { PrimaryGeneratedColumn } from "../../../../src"
import { Column } from "../../../../src"

@Entity()
export class ExampleEntity {
    @Generated("increment")
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "nvarchar", length: "max" })
    value: string
}
