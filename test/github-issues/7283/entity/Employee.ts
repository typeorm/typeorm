import { BaseEntity, Entity, OneToMany, PrimaryColumn } from "typeorm"
import { AccessEvent } from "./AccessEvent"

enum Providers {
    MS_GRAPH = "msGraph",
    ATLASSIAN = "atlassian",
}

@Entity()
export class Employee extends BaseEntity {
    @PrimaryColumn({ type: "enum", enum: Providers, enumName: "providerEnum" })
    provider!: Providers

    @OneToMany(() => AccessEvent, (accessEvent) => accessEvent.employee)
    accessEvents!: AccessEvent[]
}
