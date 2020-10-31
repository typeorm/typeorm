import {
    BeforeUpdate,
    Column,
    Connection,
    Entity, EntitySubscriberInterface, EventSubscriber,
    PrimaryGeneratedColumn
} from "../../../src";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import sinon from "sinon";
import {expect} from "chai";

describe("entity-listeners", () => {

    let beforeTransactionStart = sinon.spy()
    let afterTransactionStart = sinon.spy()
    let beforeTransactionCommit = sinon.spy()
    let afterTransactionCommit = sinon.spy()
    let beforeTransactionRollback = sinon.spy()
    let afterTransactionRollback = sinon.spy()

    @Entity()
    class Post {

        @PrimaryGeneratedColumn()
        id: number;

        @Column()
        title: string;

        @Column()
        text: string;

        @BeforeUpdate()
        beforeUpdate() {
            this.title = this.title.trim();
        }
    }

    @EventSubscriber()
    class PostSubscriber implements EntitySubscriberInterface {

        beforeTransactionStart() {
            if (beforeTransactionStart)
                beforeTransactionStart()
        }

        afterTransactionStart() {
            if (afterTransactionStart)
                afterTransactionStart()
        }

        beforeTransactionCommit() {
            if (beforeTransactionCommit)
                beforeTransactionCommit()
        }

        afterTransactionCommit() {
            if (afterTransactionCommit)
                afterTransactionCommit()
        }

        beforeTransactionRollback() {
            if (beforeTransactionRollback)
                beforeTransactionRollback()
        }

        afterTransactionRollback() {
            if (afterTransactionRollback)
                afterTransactionRollback()
        }
    }

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post],
        subscribers: [PostSubscriber],
        dropSchema: true,
        schemaCreate: true,
        logging: true,
        enabledDrivers: ["sqlite"]
    }));
    after(() => closeTestingConnections(connections));

    it("transactionStart", () => Promise.all(connections.map(async connection => {
        beforeTransactionStart.resetHistory()
        afterTransactionStart.resetHistory()

        const queryRunner = await connection.createQueryRunner()
        const startTransactionFn = sinon.spy(queryRunner, "query")

        const queryCallBeforeTransactionStart = startTransactionFn.getCalls().find(call => {
            return call.args[0] === "BEGIN TRANSACTION"
                || call.args[0] === "START TRANSACTION"
                || call.args[0] === "SET TRANSACTION ISOLATION LEVEL READ COMMITTED"
        })
        expect(queryCallBeforeTransactionStart).to.be.undefined;

        await queryRunner.startTransaction()

        const queryCallAfterTransactionStart = startTransactionFn.getCalls().find(call => {
            return call.args[0] === "BEGIN TRANSACTION"
                || call.args[0] === "START TRANSACTION"
                || call.args[0] === "SET TRANSACTION ISOLATION LEVEL READ COMMITTED"
        })
        expect(queryCallAfterTransactionStart).to.be.not.undefined;
        expect(beforeTransactionStart.called).to.be.true;
        expect(afterTransactionStart.called).to.be.true;
        expect(beforeTransactionStart.getCall(0).calledBefore(queryCallAfterTransactionStart!)).to.be.true;
        expect(afterTransactionStart.getCall(0).calledAfter(queryCallAfterTransactionStart!)).to.be.true;


        startTransactionFn.restore()
        await queryRunner.release()
    })));

    it("transactionCommit", () => Promise.all(connections.map(async connection => {
        beforeTransactionCommit.resetHistory()
        afterTransactionCommit.resetHistory()

        const queryRunner = await connection.createQueryRunner()
        const commitTransactionFn = sinon.spy(queryRunner, "query")

        const queryCallBeforeTransactionCommit = commitTransactionFn.getCalls().find(call => {
            return call.args[0] === "COMMIT"
        })
        expect(queryCallBeforeTransactionCommit).to.be.undefined;

        await queryRunner.commitTransaction()

        const queryCallAfterTransactionCommit = commitTransactionFn.getCalls().find(call => {
            return call.args[0] === "COMMIT"
        })
        expect(queryCallAfterTransactionCommit).to.be.not.undefined;
        expect(beforeTransactionCommit.called).to.be.true;
        expect(afterTransactionCommit.called).to.be.true;
        expect(beforeTransactionCommit.getCall(0).calledBefore(queryCallAfterTransactionCommit!)).to.be.true;
        expect(afterTransactionCommit.getCall(0).calledAfter(queryCallAfterTransactionCommit!)).to.be.true;


        commitTransactionFn.restore()
        await queryRunner.release()
    })));

    it("transactionRollback", () => Promise.all(connections.map(async connection => {
        beforeTransactionRollback.resetHistory()
        afterTransactionRollback.resetHistory()

        const queryRunner = await connection.createQueryRunner()
        const rollbackTransactionFn = sinon.spy(queryRunner, "query")

        const queryCallBeforeTransactionRollback = rollbackTransactionFn.getCalls().find(call => {
            return call.args[0] === "ROLLBACK"
        })
        expect(queryCallBeforeTransactionRollback).to.be.undefined;

        await queryRunner.startTransaction()
        await queryRunner.rollbackTransaction()

        const queryCallAfterTransactionRollback = rollbackTransactionFn.getCalls().find(call => {
            return call.args[0] === "ROLLBACK"
        })
        expect(queryCallAfterTransactionRollback).to.be.not.undefined;
        expect(beforeTransactionRollback.called).to.be.true;
        expect(afterTransactionRollback.called).to.be.true;
        expect(beforeTransactionRollback.getCall(0).calledBefore(queryCallAfterTransactionRollback!)).to.be.true;
        expect(afterTransactionRollback.getCall(0).calledAfter(queryCallAfterTransactionRollback!)).to.be.true;


        rollbackTransactionFn.restore()
        await queryRunner.release()
    })));

});
