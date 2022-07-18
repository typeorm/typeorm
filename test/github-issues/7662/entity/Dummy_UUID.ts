import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Dummy {
    @PrimaryGeneratedColumn("uuid")
    id: string
}
