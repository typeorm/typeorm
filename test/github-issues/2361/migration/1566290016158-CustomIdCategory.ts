import {MigrationInterface, QueryRunner, Table} from "../../../../src";

export class CustomIdCategory1566290016158 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createTable(new Table({
            name: "Category",
            columns: [
                {
                    name: "custom_id",
                    type: "number",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment",
                },
                {
                    name: "name",
                    type: "varchar(255)",
                },
                {
                    name: "parent_id",
                    type: "number",
                    isNullable: true,
                },
            ],
            foreignKeys: [
                {
                    name: "parentFK",
                    columnNames: ["parentId"],
                    referencedColumnNames: ["custom_id"],
                    referencedTableName: "Category",
                    onDelete: "RESTRICT",
                }
            ],
        }), true);

        await queryRunner.createTable(new Table({
            name: "Category_closure",
            columns: [
                {
                    name: "custom_id_ancestor",
                    type: "varchar(255)",
                    isPrimary: true,
                },
                {
                    name: "custom_id_descendant",
                    type: "varchar(255)",
                    isPrimary: true,
                },
            ],
            foreignKeys: [
                {
                    name: "fkDescendant",
                    columnNames: ["custom_id_descendant"],
                    referencedColumnNames: ["custom_id"],
                    referencedTableName: "Category",
                    onDelete: "RESTRICT",
                },
                {
                    name: "fkAncestor",
                    columnNames: ["custom_id_ancestor"],
                    referencedColumnNames: ["custom_id"],
                    referencedTableName: "Category",
                    onDelete: "RESTRICT",
                }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
    }

}
