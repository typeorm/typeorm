import { expect } from "chai";
import { Connection } from "../../../src";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Subject } from "./entity/Subject.entity";

describe("github issues > #8692 BUG - join with no results produces entity with nulled properties on many to many relation with custom properties", () => {
    let connections: Connection[];

    before(
        async () =>
        (connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should return empty array if not have data relation", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = connection.getRepository(Subject);
                await repository.save(new Subject("id", "maths"));

                const data = await repository
                    .createQueryBuilder("subject")
                    .leftJoinAndSelect("subject.subjectStudents", "subjectStudent")
                    .leftJoinAndSelect("subjectStudent.student", "student")
                    .getMany();

                expect(data[0].subjectStudents.length).to.be.equal(0);
            })
        ));
});
