import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class BadUuid {
    @PrimaryGeneratedColumn("uuid")
    id?: string

    @Column({ type: "uuid", length: "36" })
    uuid: string
}
