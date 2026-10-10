import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

export enum AccountStatus {
    Active = "active",
    Disabled = "disabled",
}

export enum AccountRole {
    Admin = "admin",
    User = "user",
}

@Entity()
export class Account {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "enum", enum: AccountStatus })
    status: AccountStatus

    @Column({ type: "enum", enum: AccountRole })
    role: AccountRole

    @Column({ type: "enum", enum: AccountRole, array: true, nullable: true })
    roles: AccountRole[]

    @Column("text", { array: true, nullable: true })
    tags: string[]
}
