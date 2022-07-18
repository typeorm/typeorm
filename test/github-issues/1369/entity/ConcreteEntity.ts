import { Column, Entity } from "typeorm/index"
import { AbstractEntity } from "./AbstractEntity"

@Entity()
export class ConcreteEntity extends AbstractEntity {
    @Column() position: string
}
