import { Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class ExampleText {
    @PrimaryGeneratedColumn()
    id: string
}
