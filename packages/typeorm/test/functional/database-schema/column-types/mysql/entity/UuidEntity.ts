import { Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class UuidEntity {
    @PrimaryGeneratedColumn("uuid")
    id?: string
}
