import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class BigSetting {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id: string

    @Column({ unique: true })
    key: string

    @Column({ default: "default" })
    value: string
}
