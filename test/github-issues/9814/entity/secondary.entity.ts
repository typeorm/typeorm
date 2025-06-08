import { Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class TypeormTestSecondary {
    @PrimaryGeneratedColumn({ type: "int" })
    ID: number
}
