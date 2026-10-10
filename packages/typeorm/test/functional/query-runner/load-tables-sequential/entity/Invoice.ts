import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

export enum InvoiceState {
    Draft = "draft",
    Paid = "paid",
}

@Entity()
export class Invoice {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "enum", enum: InvoiceState })
    state: InvoiceState

    @Column("int", { array: true, nullable: true })
    lineIds: number[]
}
