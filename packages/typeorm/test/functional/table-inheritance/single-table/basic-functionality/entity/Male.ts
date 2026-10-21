import { ChildEntity, Column } from "../../../../../../src"
import { Human } from "./Human"

@ChildEntity()
export class Male extends Human {
    @Column()
    name: string

    @Column()
    age: number
}
