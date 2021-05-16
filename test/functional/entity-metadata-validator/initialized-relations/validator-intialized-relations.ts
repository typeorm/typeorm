import "reflect-metadata";
import {Connection} from "../../../../src/connection/Connection";
import {ConnectionMetadataBuilder} from "../../../../src/connection/ConnectionMetadataBuilder";
import {EntityMetadataValidator} from "../../../../src/metadata-builder/EntityMetadataValidator";
import {expect} from "chai";
import {InitializedRelationError} from "../../../../src/error/InitializedRelationError";
import {Category} from "./entity/Category";
import {Post} from "./entity/Post";
import {Image} from "./entity/Image";
import {ImageInfo} from "./entity/ImageInfo";
import {Question} from "./entity/Question";

describe("entity-metadata-validator > initialized relations", () => {

    it("should throw error if relation with initialized array was found on many-to-many relation", () => {
        const connection = new Connection({ // dummy connection options, connection won't be established anyway
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [Post, Category]
        });
        const connectionMetadataBuilder = new ConnectionMetadataBuilder(connection);
        const entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas([Post, Category]);
        const entityMetadataValidator = new EntityMetadataValidator();
        expect(() => entityMetadataValidator.validateMany(entityMetadatas, connection.driver)).to.throw(InitializedRelationError);
    });

    it("should throw error if relation with initialized array was found on one-to-many relation", () => {
        const connection = new Connection({ // dummy connection options, connection won't be established anyway
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [Image, ImageInfo]
        });
        const connectionMetadataBuilder = new ConnectionMetadataBuilder(connection);
        const entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas([Image, ImageInfo]);
        const entityMetadataValidator = new EntityMetadataValidator();
        expect(() => entityMetadataValidator.validateMany(entityMetadatas, connection.driver)).to.throw(InitializedRelationError);
    });

    it("should not throw error if relation with initialized array was not found", () => {
        const connection = new Connection({ // dummy connection options, connection won't be established anyway
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [Category]
        });
        const connectionMetadataBuilder = new ConnectionMetadataBuilder(connection);
        const entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas([Category]);
        const entityMetadataValidator = new EntityMetadataValidator();
        expect(() => entityMetadataValidator.validateMany(entityMetadatas, connection.driver)).not.to.throw(InitializedRelationError);
    });

    it("should not throw error if relation with initialized array was found, but persistence for this relation was disabled", () => {
        const connection = new Connection({ // dummy connection options, connection won't be established anyway
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [Question, Category]
        });
        const connectionMetadataBuilder = new ConnectionMetadataBuilder(connection);
        const entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas([Question, Category]);
        const entityMetadataValidator = new EntityMetadataValidator();
        expect(() => entityMetadataValidator.validateMany(entityMetadatas, connection.driver)).not.to.throw(InitializedRelationError);
    });

});