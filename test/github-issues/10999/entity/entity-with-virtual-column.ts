import { Entity, PrimaryGeneratedColumn, VirtualColumn } from "../../../../src"

@Entity({ name: "entity_with_virtual_column" })
export class EntityWithVirtualColumn {
    @PrimaryGeneratedColumn()
    id: number

    // removed column to test migration:generate
    // @Column({ type: 'int' })
    // foo!: number;

    @VirtualColumn({
        type: "int",
        query: (alias) => {
            return `
                SELECT
                    "id"
                FROM
                    "entity_with_virtual_column"
                WHERE
                    "id" = ${alias}.id`
        },
    })
    bar: number
}
