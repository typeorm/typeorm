import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { Entity } from "../../../../src/decorator/entity/Entity"

@Entity()
export class Book {
    @PrimaryColumn()
    ean: string
}

@Entity({ withoutRowid: true })
export class Book2 {
    @PrimaryColumn()
    ean: string
}
