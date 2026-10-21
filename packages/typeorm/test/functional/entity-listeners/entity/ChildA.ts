import {
    BeforeInsert,
    BeforeUpdate,
    ChildEntity,
    Column,
} from "../../../../src"
import { Parent } from "./Parent"

@ChildEntity()
export class ChildA extends Parent {
    @Column()
    count: number

    @BeforeInsert()
    @BeforeUpdate()
    beforeInsertOrUpdate() {
        this.count++
    }
}
