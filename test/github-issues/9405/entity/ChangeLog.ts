import { OneToMany, ChildEntity } from "../../../../src/index.js"
import { Change } from "./Change.js"
import { Log } from "./Log.js"

@ChildEntity()
export abstract class ChangeLog<T> extends Log {
    @OneToMany(() => Change, (change) => change.log, { cascade: true })
    changes: Change<T>[]
}
