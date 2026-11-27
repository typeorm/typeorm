import { ChildEntity } from "../../../../../src/index"
import { Change } from "./Change"
import { ChangeLog } from "./ChangeLog"

export interface Email {}

@ChildEntity()
export class EmailChanged extends ChangeLog<Email> {
    declare changes: Change<Email>[]
}
