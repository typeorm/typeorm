import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
} from "../../../../src"

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn({ name: "orderColumn" })
    private _orderColumn: number

    @Column()
    name: string

    get orderColumn() {
        return this._orderColumn
    }

    set orderColumn(value: number) {
        this._orderColumn = value
    }
}
