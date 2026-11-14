import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class BigintEntity {
    @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
    id: string

    @Column()
    label: string
}
