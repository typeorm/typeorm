import { Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class ChildEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string
}
