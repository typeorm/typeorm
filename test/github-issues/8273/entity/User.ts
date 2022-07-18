import { Entity, PrimaryColumn, Column, Generated } from "typeorm"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @Column({ type: "uuid" })
    uuid: string

    @Column({ type: "uuid" })
    @Generated("uuid")
    uuidWithGenerated: string

    @Column()
    increment: number

    @Column()
    @Generated("increment")
    incrementWithGenerated: number
}
