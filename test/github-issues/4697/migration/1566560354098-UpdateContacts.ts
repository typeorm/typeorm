import { MigrationInterface, QueryRunner } from "@typeorm/core";
import { Item } from "../entity/item.entity";

export class UpdateContacts1566560354098 implements MigrationInterface {

    public async up({connection}: QueryRunner): Promise<any> {
        const repo = connection.getRepository(Item);
        const items: Array<Item> = await repo.find();

        items.forEach((item) => {
            if (!item.contacts) {
                item.contacts = [item.contact || ""];
            }
        });

        await repo.save(items);
    }

    public async down({connection}: QueryRunner): Promise<any> {
        const repo = connection.getRepository(Item);
        const items: Array<Item> = await repo.find();

        items.forEach((item) => {
            item.contact = item.contacts[0];
        });

        await repo.save(items);
    }

}
