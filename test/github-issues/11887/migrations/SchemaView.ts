import { MigrationInterface, QueryRunner, Table, View } from "../../../../src"

export class SchemaView1764343604699 implements MigrationInterface {
    name = "SchemaView1764343604699"

    fooTable = new Table({
        name: "foo",
        columns: [
            {
                name: "id",
                type: "int",
                isPrimary: true,
                isGenerated: true,
                generationStrategy: "increment",
            },
            {
                name: "updated_at",
                type: "timestamptz",
                isNullable: true,
                onUpdate: "NOW()",
            },
        ],
    })

    fooView = new View({
        name: "foo_view",
        schema: "other_schema",
        expression: "SELECT updated_at FROM foo",
    })

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(this.fooTable)
        await queryRunner.createView(this.fooView, true)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropView(this.fooView)
        await queryRunner.dropTable(this.fooTable)
    }
}
