import "reflect-metadata";
import {Connection} from "../../../../../src/connection/Connection";
import {EntityMetadataValidator} from "../../../../../src/metadata-builder/EntityMetadataValidator";
import {ConnectionMetadataBuilder} from "../../../../../src/connection/ConnectionMetadataBuilder";
import {expect} from "chai";

describe("relations > eager relations > circular eager relations", () => {

    it("should throw error if eager: true is set on both sides of relationship", () => {
        const connection = new Connection({ // dummy connection options, connection won't be established anyway
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [__dirname + "/entity/*{.js,.ts}"]
        });
        const connectionMetadataBuilder = new ConnectionMetadataBuilder(connection);
        const entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas([__dirname + "/entity/*{.js,.ts}"]);
        const entityMetadataValidator = new EntityMetadataValidator();
        expect(() => entityMetadataValidator.validateMany(entityMetadatas, connection.driver)).to.throw(Error);
    });

});
