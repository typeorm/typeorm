import { Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity("root")
export class RootEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string
}
