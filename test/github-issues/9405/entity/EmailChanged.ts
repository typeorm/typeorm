import { ChildEntity } from "../../../../src/index.js"
import { ChangeLog } from "./ChangeLog.js"

export class Email {}

@ChildEntity()
export class EmailChanged extends ChangeLog<Email> {}
