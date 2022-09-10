import { Column, Entity, PrimaryColumn } from "../../../../../src"
import { GlobalSecondaryIndex } from "../../../../../src"

@GlobalSecondaryIndex({
    name: "nameIndex",
    partitionKey: ["firstname", "lastname"],
    sortKey: "lastname",
})
@Entity({ name: "person_t", database: "local", schema: "my-app" })
export class Person {
    @PrimaryColumn({ name: "id", type: "varchar" })
    id: string

    @Column({ name: "firstname", type: "varchar" })
    firstname: string

    @Column({ name: "lastname", type: "varchar" })
    lastname: string

    @Column({ name: "loginCount", type: "number" })
    loginCount: number
}
