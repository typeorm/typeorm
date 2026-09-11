import { Entity, PrimaryColumn } from "../../../../../src"

@Entity()
export class Tag {
    @PrimaryColumn()
    firstId: number

    @PrimaryColumn()
    secondId: number
}
