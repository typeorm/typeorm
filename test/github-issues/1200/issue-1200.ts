import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {A} from "./entity/A";
import {expect} from "chai";

describe("github issues > #1141: Pull request: Multiple nested embedded entities update fix", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should update all embedded entities", () => Promise.all(connections.map(async connection => {

        // create and save a new user
        const a: A = new A();
        a.n = 1;
        a.b.n = 2;
        a.b.c.n = 3;
        a.b.c.d.n = 4;
        a.c.n = 5;
        a.c.d.n = 6;
        await connection.manager.save(a);

        // load and check if saved object is correct
        const loadedA = await connection.manager.findOneById(A, 1);
        expect(loadedA).not.to.be.empty;
        loadedA!.should.be.eql({
            id: 1,
            n: 1,
            b: {
                n: 2,
                c: {
                    n: 3,
                    d: {
                        n: 4
                    }
                }
            },
            c: {
                n: 5,
                d: {
                    n: 6
                }
            }
        });

        // update object's properties
        await connection.createQueryBuilder()
            .update(A)
            .set({
                n: 11,
                b: {
                    n: 12,
                    c: {
                        n: 13,
                        d: {
                            n: 14
                        }
                    }
                },
                c: {
                    n: 15,
                    d: {
                        n: 16
                    }
                }
            })
            .where({
                id: 1
            })
            .execute();

        // load and check again
        const loadedA2 = await connection.manager.findOneById(A, 1);
        expect(loadedA2).not.to.be.empty;
        loadedA2!.should.be.eql({
            id: 1,
            n: 11,
            b: {
                n: 12,
                c: {
                    n: 13,
                    d: {
                        n: 14
                    }
                }
            },
            c: {
                n: 15,
                d: {
                    n: 16
                }
            }
        });

    })));

});
