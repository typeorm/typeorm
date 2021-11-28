import { getConnectionManager } from "../../../src";
import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections } from "../../utils/test-utils";
import { User } from "./entity/User";

describe("github issues > #4753 MySQL Replication Config broken", () => {
    let connections: Connection[] = [];
    after(() => closeTestingConnections(connections));

    it("should connect without error when using replication", async () => {
        const connection = getConnectionManager().create({
            type: "mysql",
            ssl: {
                ca: "GLOBAL",
                key: "GLOBAL",
                cert: "GLOBAL",
            },
            replication: {
                master: {
                    username: "test",
                    password: "test",
                    database: "test",
                    ssl: {
                        ca: "MASTER",
                        key: "MASTER",
                        cert: "MASTER",
                    },
                },
                slaves: [
                    {
                        username: "test",
                        password: "test",
                        database: "test",
                        ssl: {
                            ca: "CHILD",
                            key: "CHILD",
                            cert: "CHILD",
                        },
                    },
                    {
                        username: "test",
                        password: "test",
                        database: "test",
                    },
                ],
            },
            entities: [User],
        });
        connections.push(connection);
        await connection.connect();
        let result: any = connection;
        result.driver.poolCluster._nodes.MASTER.pool.config.connectionConfig.ssl.ca.should.be.eql(
            "MASTER"
        );
        result.driver.poolCluster._nodes.SLAVE0.pool.config.connectionConfig.ssl.ca.should.be.eql(
            "CHILD"
        );
        result.driver.poolCluster._nodes.SLAVE1.pool.config.connectionConfig.ssl.ca.should.be.eql(
            "GLOBAL"
        );
    });
});
