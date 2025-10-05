import { QueryResult } from "../../../src"
import { DataSource } from "../../../src/data-source/DataSource"
import { EntityManager } from "../../../src/entity-manager/EntityManager"
import { QueryRunner } from "../../../src/query-runner/QueryRunner"
import { expect } from "chai"
import sinon from "sinon"
import "reflect-metadata"

describe("github issues > #11566 .query() useStructuredResult option", () => {
    let dataSource: DataSource
    let queryRunner: QueryRunner
    let manager: EntityManager

    let queryStub: sinon.SinonStub
    let releaseStub: sinon.SinonStub
    let createQueryRunnerStub: sinon.SinonStub

    const fakeResult = new QueryResult()
    fakeResult.records = [{ id: 1 }, { id: 2 }]
    fakeResult.recordsets = [[{ id: 1 }, { id: 2 }], [{ id: 2 }]]

    beforeEach(() => {
        // Create stubs for QueryRunner and EntityManager
        queryStub = sinon.stub().resolves("structured-result")
        releaseStub = sinon.stub().resolves()
        queryRunner = {} as any
        Object.defineProperty(queryRunner, "query", {
            value: queryStub,
            writable: true,
        })
        Object.defineProperty(queryRunner, "release", {
            value: releaseStub,
            writable: true,
        })
        // Make isReleased a getter/setter property so we can mutate it in tests
        let _isReleased = false
        Object.defineProperty(queryRunner, "isReleased", {
            get: () => _isReleased,
            set: (v) => {
                _isReleased = v
            },
            configurable: true,
        })
        manager = {
            getRepository: sinon.stub(),
            query: sinon
                .stub()
                .callsFake(
                    async (
                        query: string,
                        parameters?: any[],
                        useStructuredResult?: boolean,
                    ) => {
                        if (useStructuredResult) {
                            return fakeResult
                        }
                        return [{ id: 1 }, { id: 2 }]
                    },
                ),
            transaction: async (fn: any) => fn(manager),
        } as any
        dataSource = Object.create(DataSource.prototype)
        Object.defineProperty(dataSource, "manager", {
            value: manager,
            configurable: true,
        })
        createQueryRunnerStub = sinon.stub().returns(queryRunner)
        Object.defineProperty(dataSource, "createQueryRunner", {
            value: createQueryRunnerStub,
            writable: true,
        })
        Object.defineProperty(dataSource, "isInitialized", {
            value: true,
            configurable: true,
        })
    })

    it("should pass useStructuredResult to QueryRunner.query when provided", async () => {
        await dataSource.query("SELECT 1", [], queryRunner, {
            useStructuredResult: true,
        })
        sinon.assert.calledWith(queryStub, "SELECT 1", [], {
            useStructuredResult: true,
        })
    })

    it("should default useStructuredResult to undefined if not provided", async () => {
        await dataSource.query("SELECT 1", [], queryRunner)
        sinon.assert.calledWith(queryStub, "SELECT 1", [])
    })

    it("should return a structured result when useStructuredResult is true and multiple queries are defined", async () => {
        queryStub.resolves(fakeResult)
        const result = await dataSource.query(
            `SELECT * FROM users; SELECT id FROM users WHERE id = 2;`,
            [],
            undefined,
            { useStructuredResult: true },
        )
        expect(result).to.be.instanceOf(QueryResult)
        expect(result.records).to.deep.equal([{ id: 1 }, { id: 2 }])
        expect(result.recordsets).to.deep.equal([
            [{ id: 1 }, { id: 2 }],
            [{ id: 2 }],
        ])
    })

    it("should return a structured result in the same way when using EntityManager.query & useStructuredResult", async () => {
        queryStub.resolves(fakeResult)
        const result = await manager.query(
            `SELECT * FROM users; SELECT id FROM users WHERE id = 2;`,
            [],
            { useStructuredResult: true },
        )
        expect(result).to.be.instanceOf(QueryResult)
        expect(result.records).to.deep.equal([{ id: 1 }, { id: 2 }])
        expect(result.recordsets).to.deep.equal([
            [{ id: 1 }, { id: 2 }],
            [{ id: 2 }],
        ])
    })

    it("should return a structured result in the same way when using DataSource.query & useStructuredResult", async () => {
        queryStub.resolves(fakeResult)
        const result = await dataSource.query(
            `
                SELECT * FROM users;
                SELECT id FROM users WHERE id = 2;
            `,
            [],
            undefined,
            { useStructuredResult: true },
        )

        expect(result).to.be.instanceOf(QueryResult)
        expect(result.records).to.deep.equal([{ id: 1 }, { id: 2 }])
        expect(result.recordsets).to.deep.equal([
            [{ id: 1 }, { id: 2 }],
            [{ id: 2 }],
        ])
    })
})
