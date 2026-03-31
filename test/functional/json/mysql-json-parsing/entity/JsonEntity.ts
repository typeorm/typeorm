import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class JsonEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "json", nullable: true })
    jsonObject: any

    @Column({ type: "json", nullable: true })
    jsonArray: any[]

    @Column({ type: "json", nullable: true })
    jsonString: string

    @Column({ type: "json", nullable: true })
    jsonNumber: number

    @Column({ type: "json", nullable: true })
    jsonBoolean: boolean

    @Column({ type: "json", nullable: true })
    jsonNull: null

    @Column({ type: "json", nullable: true })
    complexJson: any
}
