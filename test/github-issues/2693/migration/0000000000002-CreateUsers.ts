import { MigrationInterface, QueryRunner, Table } from "@typeorm/core";

export class CreateUsers0000000000002 implements MigrationInterface {
    public up(queryRunner: QueryRunner): Promise<any> {
        return queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()"
                    }
                ]
            })
        );
    }

    public down(queryRunner: QueryRunner): Promise<any> {
        return queryRunner.dropTable("users");
    }
}
