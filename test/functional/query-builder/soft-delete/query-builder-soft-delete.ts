import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {MysqlDriver} from "../../../../src/driver/mysql/MysqlDriver";
import {LimitOnUpdateNotSupportedError} from "../../../../src/error/LimitOnUpdateNotSupportedError";
import {Not, IsNull} from "../../../../src";
import {MissingDeleteDateColumnError} from "../../../../src/error/MissingDeleteDateColumnError";
import {UserWithoutDeleteDateColumn} from "./entity/UserWithoutDeleteDateColumn";

describe("query builder > soft-delete", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should perform soft deletion and recovery correctly", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Alex Messer";

        await connection.manager.save(user);

        await connection
            .createQueryBuilder()
            .softDelete()
            .from(User)
            .where("name = :name", { name: "Alex Messer" })
            .execute();

        const loadedUser1 = await connection.getRepository(User).findOne({ name: "Alex Messer" });
        expect(loadedUser1).to.exist;
        expect(loadedUser1!.deletedAt).to.be.instanceof(Date);

        await connection.getRepository(User)
            .createQueryBuilder()
            .restore()
            .from(User)
            .where("name = :name", { name: "Alex Messer" })
            .execute();

        const loadedUser2 = await connection.getRepository(User).findOne({ name: "Alex Messer" });
        expect(loadedUser2).to.exist;
        expect(loadedUser2!.deletedAt).to.be.equals(null);

    })));

    it("should perform soft delete with limit correctly", () => Promise.all(connections.map(async connection => {

        const user1 = new User();
        user1.name = "Alex Messer";
        const user2 = new User();
        user2.name = "Muhammad Mirzoev";
        const user3 = new User();
        user3.name = "Brad Porter";

        await connection.manager.save([user1, user2, user3]);

        const limitNum = 2;

        if (connection.driver instanceof MysqlDriver) {
            await connection.createQueryBuilder()
            .softDelete()
            .from(User)
            .limit(limitNum)
            .execute();

            const loadedUsers = await connection.getRepository(User).find({deletedAt: Not(IsNull())});
            expect(loadedUsers).to.exist;
            loadedUsers!.length.should.be.equal(limitNum);
        } else {
            await connection.createQueryBuilder()
            .softDelete()
            .from(User)
            .limit(limitNum)
            .execute().should.be.rejectedWith(LimitOnUpdateNotSupportedError);
        }

    })));


    it("should perform restory with limit correctly", () => Promise.all(connections.map(async connection => {

        const user1 = new User();
        user1.name = "Alex Messer";
        const user2 = new User();
        user2.name = "Muhammad Mirzoev";
        const user3 = new User();
        user3.name = "Brad Porter";

        await connection.manager.save([user1, user2, user3]);

        const limitNum = 2;

        if (connection.driver instanceof MysqlDriver) {
            await connection.createQueryBuilder()
            .softDelete()
            .from(User)
            .execute();

            await connection.createQueryBuilder()
            .restore()
            .from(User)
            .limit(limitNum)
            .execute();

            const loadedUsers = await connection.getRepository(User).find({deletedAt: IsNull()});
            expect(loadedUsers).to.exist;
            loadedUsers!.length.should.be.equal(limitNum);
        } else {
            await connection.createQueryBuilder()
            .restore()
            .from(User)
            .limit(limitNum)
            .execute().should.be.rejectedWith(LimitOnUpdateNotSupportedError);
        }

    })));

    it("should throw error when delete date column is missing", () => Promise.all(connections.map(async connection => {

        const user = new UserWithoutDeleteDateColumn();
        user.name = "Alex Messer";

        await connection.manager.save(user);

        let error1: Error | undefined;
        try {
            await connection.createQueryBuilder()
                .softDelete()
                .from(UserWithoutDeleteDateColumn)
                .where("name = :name", { name: "Alex Messer" })
                .execute();
        } catch (err) {
            error1 = err;
        }
        expect(error1).to.be.an.instanceof(MissingDeleteDateColumnError);

        let error2: Error | undefined;
        try {
            await connection.createQueryBuilder()
                .restore()
                .from(UserWithoutDeleteDateColumn)
                .where("name = :name", { name: "Alex Messer" })
                .execute();
        } catch (err) {
            error2 = err;
        }
        expect(error2).to.be.an.instanceof(MissingDeleteDateColumnError);

    })));

});
