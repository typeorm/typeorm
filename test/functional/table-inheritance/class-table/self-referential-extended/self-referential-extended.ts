import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Account } from "./entity/Account"
import { Space } from "./entity/Space"
import { AuthPolicy } from "./entity/AuthPolicy"
import { Profile } from "./entity/Profile"
import { expect } from "chai"

describe("table-inheritance > class-table > self-referential-extended", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    function makeAuth(rules: string): AuthPolicy {
        const a = new AuthPolicy()
        a.rules = rules
        return a
    }

    function makeProfile(name: string): Profile {
        const p = new Profile()
        p.displayName = name
        return p
    }

    async function insertAccount(
        ds: DataSource,
        nameID: string,
    ): Promise<Account> {
        const acc = new Account()
        acc.nameID = nameID
        acc.plan = "free"
        acc.authorization = makeAuth("acc-rules")
        acc.profile = makeProfile(nameID)
        acc.credentials = []
        acc.spaces = []
        return ds.getRepository(Account).save(acc)
    }

    async function insertSpace(
        ds: DataSource,
        nameID: string,
        account: Account,
        parent?: Space,
    ): Promise<Space> {
        const space = new Space()
        space.nameID = nameID
        space.level = parent ? parent.level + 1 : 0
        space.account = account
        space.authorization = makeAuth("space-rules")
        space.profile = makeProfile(nameID)
        space.credentials = []
        if (parent) space.parentSpace = parent
        return ds.getRepository(Space).save(space)
    }

    it("(4a) should load with nested self-referential relations (2 levels deep)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const acc = await insertAccount(connection, "account")
                const root = await insertSpace(
                    connection,
                    "root",
                    acc,
                )
                const child1 = await insertSpace(
                    connection,
                    "child1",
                    acc,
                    root,
                )
                await insertSpace(
                    connection,
                    "child2",
                    acc,
                    root,
                )
                await insertSpace(
                    connection,
                    "grandchild1",
                    acc,
                    child1,
                )

                const space = await connection.manager.findOne(Space, {
                    where: { id: root.id },
                    relations: { subspaces: { subspaces: true } },
                })
                expect(space).to.not.be.null
                expect(space!.subspaces).to.have.length(2)

                const c1 = space!.subspaces.find(
                    (s) => s.nameID === "child1",
                )
                expect(c1).to.not.be.undefined
                expect(c1!.subspaces).to.have.length(1)
                expect(c1!.subspaces[0].nameID).to.equal("grandchild1")

                const c2 = space!.subspaces.find(
                    (s) => s.nameID === "child2",
                )
                expect(c2).to.not.be.undefined
                expect(c2!.subspaces).to.have.length(0)
            }),
        ))

    it("(4b) should load parent via ManyToOne self-ref", () =>
        Promise.all(
            connections.map(async (connection) => {
                const acc = await insertAccount(connection, "account")
                const root = await insertSpace(
                    connection,
                    "root",
                    acc,
                )
                const child = await insertSpace(
                    connection,
                    "child",
                    acc,
                    root,
                )

                const subspace = await connection.manager.findOne(Space, {
                    where: { id: child.id },
                    relations: { parentSpace: true },
                })
                expect(subspace).to.not.be.null
                expect(subspace!.parentSpace).to.not.be.undefined
                expect(subspace!.parentSpace!.id).to.equal(root.id)
            }),
        ))

    it("(4c) should QB with self-referential joins", () =>
        Promise.all(
            connections.map(async (connection) => {
                const acc = await insertAccount(connection, "account")
                const root = await insertSpace(
                    connection,
                    "root",
                    acc,
                )
                const child = await insertSpace(
                    connection,
                    "child",
                    acc,
                    root,
                )
                await insertSpace(
                    connection,
                    "grandchild",
                    acc,
                    child,
                )

                const space = await connection
                    .getRepository(Space)
                    .createQueryBuilder("space")
                    .leftJoinAndSelect("space.subspaces", "subspace")
                    .leftJoinAndSelect(
                        "subspace.subspaces",
                        "grandchild",
                    )
                    .where("space.id = :id", { id: root.id })
                    .getOne()

                expect(space).to.not.be.null
                expect(space!.subspaces).to.have.length(1)
                expect(space!.subspaces[0].subspaces).to.have.length(1)
                expect(
                    space!.subspaces[0].subspaces[0].nameID,
                ).to.equal("grandchild")
            }),
        ))

    it("(4d) should load root space with account via QB", () =>
        Promise.all(
            connections.map(async (connection) => {
                const acc = await insertAccount(connection, "account")
                const root = await insertSpace(
                    connection,
                    "root",
                    acc,
                )

                const space = await connection
                    .getRepository(Space)
                    .createQueryBuilder("space")
                    .leftJoinAndSelect("space.account", "account")
                    .where("space.id = :id", { id: root.id })
                    .getOne()

                expect(space).to.not.be.null
                expect(space!.account).to.not.be.undefined
                expect(space!.account.id).to.equal(acc.id)
            }),
        ))
})
