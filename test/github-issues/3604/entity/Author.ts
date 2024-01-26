import { PrimaryGeneratedColumn } from "../../../../src"
import { Entity } from "../../../../src"

@Entity()
export class Author {
    @PrimaryGeneratedColumn("uuid")
    id: string
}
