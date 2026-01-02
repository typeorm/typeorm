import { MigrationInterface, QueryRunner, Table, View } from "../../../../src"

export class MetadataView1764343604699 implements MigrationInterface {
    name = "MetadataView1764343604699"

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
        expression: "SELECT updated_at FROM foo",
    })

    mFooView = new View({
        name: "materialized_foo_view",
        materialized: true,
        expression: "SELECT updated_at FROM foo",
    })

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(this.fooTable)
        await queryRunner.createView(this.fooView)
        await queryRunner.createView(this.mFooView)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropView(this.mFooView)
        await queryRunner.dropView(this.fooView)
        await queryRunner.dropTable(this.fooTable)
    }
}
