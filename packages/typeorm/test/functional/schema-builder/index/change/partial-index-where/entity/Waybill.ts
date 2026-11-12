import { Column, Entity, Index, PrimaryColumn } from "../../../../../../../src"

@Entity()
@Index("waybill WHERE open", ["reference"])
export class Waybill {
    @PrimaryColumn()
    id: number

    @Column()
    reference: string
}
