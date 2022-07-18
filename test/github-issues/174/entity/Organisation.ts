import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Contact } from "./Contact"

@Entity()
export class Organisation {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column((type) => Contact)
    contact: Contact
}
