import { Column, PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity("bar")
export class Bar {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    description: string
}
