import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"
import { RecordData } from "./RecordData"
import { RecordConfig } from "./RecordConfig"

@Entity()
export class Record {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "json", array: true })
    configs: RecordConfig[]

    @Column({ type: "jsonb", array: true })
    datas: RecordData[]
}
