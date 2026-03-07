import {
    Entity,
    PrimaryColumn,
    Column,
    UpdateDateColumn,
    ManyToOne,
} from "../../../../../src"
import { DayDemand } from "./DayDemand"
import { Material } from "./Material"
import { TransportUnitType } from "./TransportUnitType"

@Entity()
export class Demand {
    @PrimaryColumn("uuid")
    id: string

    @UpdateDateColumn()
    lastUpdate?: Date

    @Column({ type: "int" })
    amount: number

    @ManyToOne(() => TransportUnitType, { nullable: false })
    transportUnitType: TransportUnitType

    @ManyToOne(() => Material, { nullable: false })
    materialType: Material

    @ManyToOne(() => DayDemand, { nullable: true })
    dayDemand?: DayDemand
}
