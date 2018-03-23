import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Parent} from "./entity/Parent";
import {Child} from "./entity/Child";
import {expect} from "chai";

describe("github issues > #1055 ind with relations not working, correct syntax causes type error", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mariadb"] // only one driver is enabled because this example uses lazy relations
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it.skip("should be able to find by object reference", () => Promise.all(connections.map(async connection => {
        const manager = connection.manager;

        const parent = new Parent();
        parent.name = "Parent";
        await manager.save(parent);

        const loadedParent = await manager.findOneById(Parent, 1);
        expect(loadedParent).not.to.be.empty;

        if (!loadedParent) return;

        const child = new Child();
        child.name = "Child";
        child.parent = Promise.resolve(loadedParent);
        await manager.save(child);

        const foundChild = await manager.findOne(Child, {parent: loadedParent});
        // SQL Error: QueryFailedError: ER_PARSE_ERROR: You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ' `id` = 1' at line 1
        /**
         * TypeScript Error
         *
         * test/github-issues/1055/issue-1055.ts(35,57): error TS2345: Argument of type '{ parent: Parent; }' is not assignable to parameter of type 'Partial<Child> | undefined'.
         *  Type '{ parent: Parent; }' is not assignable to type 'Partial<Child>'.
         *   Types of property 'parent' are incompatible.
         *    Type 'Parent' is not assignable to type 'Promise<Parent> | undefined'.
         *     Type 'Parent' is not assignable to type 'Promise<Parent>'.
         *      Property '[Symbol.toStringTag]' is missing in type 'Parent'.
         */
        expect(foundChild).not.to.be.empty;
    })));


    it.skip("should be able to lookup from promise as well", () => Promise.all(connections.map(async connection => {
        const manager = connection.manager;

        const parent = new Parent();
        parent.name = "Parent";
        await manager.save(parent);

        const loadedParent = await manager.findOneById(Parent, 1);
        expect(loadedParent).not.to.be.empty;

        if (!loadedParent) return;

        const child = new Child();
        child.name = "Child";
        child.parent = Promise.resolve(loadedParent);
        await manager.save(child);

        const foundChild = await manager.findOne(Child, {parent: Promise.resolve(loadedParent)});
        // QueryFailedError: ER_BAD_FIELD_ERROR: Unknown column 'domain' in 'where clause'
        expect(foundChild).not.to.be.empty;
    })));

    it("should not have type errors with the primary key type", () => Promise.all(connections.map(async connection => {
        const manager = connection.manager;

        const parent = new Parent();
        parent.name = "Parent";
        await manager.save(parent);

        const loadedParent = await manager.findOneById(Parent, 1);
        expect(loadedParent).not.to.be.empty;

        if (!loadedParent) return;

        const child = new Child();
        child.name = "Child";
        child.parent = Promise.resolve(loadedParent);
        await manager.save(child);

        const foundChild = await manager.findOne(Child, {parent: loadedParent.id});
        /**
         * TypeScript Error
         * test/github-issues/1055/issue-1055.ts(35,57): error TS2345: Argument of type '{ parent: Parent; }' is not assignable to parameter of type 'Partial<Child> | undefined'.
         *  Type '{ parent: Parent; }' is not assignable to type 'Partial<Child>'.
         *   Types of property 'parent' are incompatible.
         *     Type 'Parent' is not assignable to type 'Promise<Parent> | undefined'.
         *      Type 'Parent' is not assignable to type 'Promise<Parent>'.
         *       Property '[Symbol.toStringTag]' is missing in type 'Parent'.
         */
        expect(foundChild).not.to.be.empty;
    })));
});
