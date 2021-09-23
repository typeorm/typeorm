import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { AccountEntity } from "./entity/Account";

describe("github issues > #8205 Bug in self referencing relation-based properties in where clauses", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work properly when using 2-depth self reference where clause", () => Promise.all(connections.map(async connection => {
		const repository = connection.getRepository(AccountEntity);
		let grandParent = new AccountEntity();
		grandParent.title = "grandParent";
		grandParent = await repository.save(grandParent);
		let Parent1 = new AccountEntity();
		Parent1.title = "Parent1";
		Parent1.parentAccount = grandParent;
		Parent1 = await repository.save(Parent1);
		let Child1 = new AccountEntity();
		Child1.title = "Child1";
		Child1.parentAccount = Parent1;
		Child1 = await repository.save(Child1);

		const expectedResult = await repository.find({
			where: {
				title: "Child1"
			},
			relations: ['parentAccount', 'parentAccount.parentAccount']
		})

		const queryResult = await repository.find({
			where: {
				parentAccount: {
					parentAccount: {
						title: "grandParent"
					}
				}
			},
			relations: ['parentAccount', 'parentAccount.parentAccount']
		})

		expect(queryResult).to.be.eql(expectedResult);
    })));

	it("should work properly when using 3-depth self reference where clause", () => Promise.all(connections.map(async connection => {
		const repository = connection.getRepository(AccountEntity);
		let grandParent = new AccountEntity();
		grandParent.title = "grandParent";
		grandParent = await repository.save(grandParent);
		let Parent1 = new AccountEntity();
		Parent1.title = "Parent1";
		Parent1.parentAccount = grandParent;
		Parent1 = await repository.save(Parent1);
		let Child1 = new AccountEntity();
		Child1.title = "Child1";
		Child1.parentAccount = Parent1;
		Child1 = await repository.save(Child1);
		let grandChild1 = new AccountEntity();
		grandChild1.title = "grandChild1";
		grandChild1.parentAccount = Child1;
		grandChild1 = await repository.save(grandChild1);

		const expectedResult = await repository.find({
			where: {
				title: "grandChild1"
			},
			relations: ["parentAccount", "parentAccount.parentAccount", "parentAccount.parentAccount.parentAccount"]
		})

		const queryResult = await repository.find({
			where: {
				parentAccount: {
					parentAccount: {
						parentAccount: {
							title: "grandParent"
						}
					}
				}
			},
			relations: ["parentAccount", "parentAccount.parentAccount", "parentAccount.parentAccount.parentAccount"]
		})

		expect(queryResult).to.be.eql(expectedResult);
    })));


});
