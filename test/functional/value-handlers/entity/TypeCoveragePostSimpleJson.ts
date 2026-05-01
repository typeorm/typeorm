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
export class TypeCoveragePostSimpleJson {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: "simple-json" })
    jsonData!: JsonData

    @Column({ type: "varbinary", length: 255, nullable: true })
    binaryData!: Buffer | null

    @Column({ type: "simple-array" })
    tags!: string[]

    @Column({ type: "simple-enum", enum: UserRole })
    role!: UserRole

    @Column({ type: "nvarchar", length: 255 })
    name!: string

    @Column({ type: "int" })
    score!: number
}
