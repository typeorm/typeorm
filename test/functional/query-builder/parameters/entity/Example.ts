import { Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Example {
    @PrimaryColumn()
    id: string
}
