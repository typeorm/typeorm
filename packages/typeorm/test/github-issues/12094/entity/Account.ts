import { AfterInsert } from "../../../../src/decorator/listeners/AfterInsert"
import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Account {
    // ids observed by the AfterInsert listener across a test run
    static observedIds: (number | undefined)[] = []

    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    email: string

    @AfterInsert()
    recordObservedId(): void {
        Account.observedIds.push(this.id)
    }
}
