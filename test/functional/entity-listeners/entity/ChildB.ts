import { ChildEntity, Column } from "../../../../src"
import { Parent } from "./Parent"

@ChildEntity()
export class ChildB extends Parent {
    @Column()
    name: string
}
