import { Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class Tag {
    @PrimaryGeneratedColumn()
    id: number
}
