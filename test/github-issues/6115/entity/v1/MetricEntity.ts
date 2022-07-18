import { Column, PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm"

export enum Operator {
    LT = "lt",
    LE = "le",
    EQ = "eq",
    NE = "ne",
    GE = "ge",
    GT = "gt",
}

@Entity()
export class Metric {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: "enum", enum: Operator, default: Operator.EQ })
    defaultOperator!: string

    @Column({ type: "enum", enum: Operator })
    defaultOperator2!: string

    @Column({ type: "enum", enum: Operator, default: Operator.EQ })
    defaultOperator3!: string

    @Column({ type: "enum", enum: Operator, default: Operator.EQ })
    defaultOperator4!: string
}
