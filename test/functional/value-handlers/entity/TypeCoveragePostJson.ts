import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

export interface JsonData {
    [key: string]: unknown
}

export enum UserRole {
    ADMIN = "admin",
    EDITOR = "editor",
    VIEWER = "viewer",
}

@Entity()
export class TypeCoveragePostJson {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: "simple-json" })
    jsonData!: JsonData

    @Column({ type: "blob", nullable: true })
    binaryData!: Buffer | null

    @Column({ type: "simple-array" })
    tags!: string[]

    @Column({ type: "simple-enum", enum: UserRole })
    role!: UserRole

    @Column({ type: "varchar", length: 255 })
    name!: string

    @Column({ type: "int" })
    score!: number
}
