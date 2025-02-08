import { Entity, PrimaryGeneratedColumn, VirtualColumn } from "../../../../src"

@Entity({ name: "virtual_user" })
export class VirtualUser {
    @PrimaryGeneratedColumn()
    id: number

    @VirtualColumn({
        type: "int",
        query: (alias) => {
            return `
                SELECT
                    id
                FROM
                    virtual_user
                WHERE
                    id = ${alias}.id
            `
        },
    })
    age?: number
}
