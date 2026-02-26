import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Account } from "./entity/Account"
import { Space } from "./entity/Space"
import { VirtualContributor } from "./entity/VirtualContributor"
import { AuthPolicy } from "./entity/AuthPolicy"
import { Profile } from "./entity/Profile"
import { expect } from "chai"
import { In } from "../../../../../src"

describe("table-inheritance > class-table > cross-child-relations-extended", () => {
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
        plan: string,
    ): Promise<Account> {
        const acc = new Account()
        acc.nameID = nameID
        acc.plan = plan
        acc.authorization = makeAuth("acc-rules")
        acc.profile = makeProfile(nameID)
        acc.credentials = []
        acc.spaces = []
        acc.virtualContributors = []
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

    async function insertVC(
        ds: DataSource,
        nameID: string,
        aiModel: string,
        account: Account,
    ): Promise<VirtualContributor> {
        const vc = new VirtualContributor()
        vc.nameID = nameID
        vc.aiModel = aiModel
        vc.account = account
        vc.authorization = makeAuth("vc-rules")
        vc.profile = makeProfile(nameID)
        vc.credentials = []
        return ds.getRepository(VirtualContributor).save(vc)
    }

    it("(3a) should find VCs by nested where through cross-child ManyToOne", () =>
        Promise.all(
            connections.map(async (connection) => {
                const acc1 = await insertAccount(connection, "acc1", "free")
                const acc2 = await insertAccount(connection, "acc2", "pro")

                await insertVC(connection, "vc1", "gpt-4", acc1)
                await insertVC(connection, "vc2", "claude", acc2)

                const vcs = await connection.manager.find(VirtualContributor, {
                    where: {
                        account: { id: In([acc1.id, acc2.id]) },
                    },
                    relations: { account: true },
                })
                expect(vcs).to.have.length(2)
            }),
        ))

    it("(3b) should load Account with multiple cross-child OneToMany relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const acc = await insertAccount(connection, "acc1", "free")
                await insertSpace(connection, "space1", acc)
                await insertVC(connection, "vc1", "gpt-4", acc)

                const account = await connection.manager.findOne(Account, {
                    where: { id: acc.id },
                    relations: { spaces: true, virtualContributors: true },
                })
                expect(account).to.not.be.null
                expect(account!.spaces).to.have.length(1)
                expect(account!.virtualContributors).to.have.length(1)
            }),
        ))

    it("(3c) should load VC with account relation + nested select", () =>
        Promise.all(
            connections.map(async (connection) => {
                const acc = await insertAccount(connection, "acc1", "free")
                const vc = await insertVC(connection, "vc1", "gpt-4", acc)

                const loaded = await connection.manager.findOne(
                    VirtualContributor,
                    {
                        where: { id: vc.id },
                        relations: { account: true },
                        select: {
                            id: true,
                            account: { id: true },
                        },
                    },
                )
                expect(loaded).to.not.be.null
                expect(loaded!.account).to.not.be.undefined
                expect(loaded!.account.id).to.equal(acc.id)
            }),
        ))

    it("(3d) should load Space with its Account relation", () =>
        Promise.all(
            connections.map(async (connection) => {
                const acc = await insertAccount(connection, "acc1", "free")
                const space = await insertSpace(connection, "space1", acc)

                const loaded = await connection.manager.findOne(Space, {
                    where: { id: space.id },
                    relations: { account: true },
                })
                expect(loaded).to.not.be.null
                expect(loaded!.account).to.not.be.undefined
                expect(loaded!.account.id).to.equal(acc.id)
            }),
        ))
})
