import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Photo} from "./entity/Photo";
import {Member} from "./entity/Member";
import {expect} from "chai";

describe("github issues > #3309 findOptions uses same parameter for different where options", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"],
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should returns 2 object correctly", () => Promise.all(connections.map(async connection => {
        interface ObjInterface {
            [key: string]: Photo;
        }
        const obj: ObjInterface = {};
        const array: string[] = ["old_type", "new_type", "old_type", "new_type", "new_type"];
        array.forEach(async (type: string, i: number) => {
            const index = i + 1;
            obj[`photo${index}`] = new Photo();
            obj[`photo${index}`].type = type;
            await connection.manager.save(obj[`photo${index}`]);
        });

        await connection.synchronize();

        const member1 = new Member();
        member1.name = "John";
        member1.photos = [obj.photo1, obj.photo2];
        await connection.manager.save(member1);

        await connection.synchronize();

        const member2 = new Member();
        member2.name = "2ohn";
        member2.photos = [obj.photo3, obj.photo4, obj.photo5];
        await connection.manager.save(member2);

        await connection.synchronize();

        const result = await connection.manager.find(Photo, {
            where: {
                member: {
                    id: 2
                },
                type: "new_type"
            }
        });
        expect([result[0].type, result[1].type]).to.be.eql(["new_type", "new_type"]);

    })));

});
