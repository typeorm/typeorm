import {
    Column,
    Entity,
    PrimaryColumn,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Entity()
export class CompositeTenantItem {
    @PrimaryColumn({ type: "varchar" })
    orgId: string

    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({
        type: "varchar",
        unique: true,
        transformer: {
            to: (value: string) =>
                typeof value === "string" ? value.toLowerCase() : value,
            from: (value: string) => value,
        },
    })
    email: string
}
