import { expect } from "chai";
import { DataSource, TypeORMError } from "../../../src";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Category } from "./entity/Category";
import { Post } from "./entity/Post";

describe("entity manager > default behavior (no invalidWhereValuesBehavior configured)", () => {
    let dataSources: DataSource[];

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Category, Post],
            schemaCreate: true,
            dropSchema: true,
            disabledDrivers: ["spanner"],
        });
    });

    beforeEach(() => reloadTestingDatabases(dataSources));
    after(() => closeTestingConnections(dataSources));

    const prepareData = async (dataSource: DataSource) => {
        const category = new Category();
        category.name = "Test Category";
        category.slug = "test-category";
        await dataSource.manager.save(category);

        const post = new Post();
        post.title = "Test Post";
        post.text = "This is a test post";
        post.category = category;
        await dataSource.manager.save(post);
    };

    describe("update", () => {
        it("should throw TypeORMError when criteria contains null", async () => {
            for (const dataSource of dataSources) {
                await prepareData(dataSource);
                try {
                    await dataSource.manager.update(Post, { text: null }, { title: "Updated" });
                    expect.fail("Expected error to be thrown");
                } catch (error) {
                    expect(error).to.be.instanceOf(TypeORMError);
                    expect((error as TypeORMError).message).to.contain("Null value encountered");
                }
            }
        });

        it("should throw TypeORMError when criteria contains undefined", async () => {
            for (const dataSource of dataSources) {
                await prepareData(dataSource);
                try {
                    // @ts-expect-error - Testing runtime behavior with invalid undefined criteria
                    await dataSource.manager.update(Post, { text: undefined }, { title: "Updated" });
                    expect.fail("Expected error to be thrown");
                } catch (error) {
                    expect(error).to.be.instanceOf(TypeORMError);
                    expect((error as TypeORMError).message).to.contain("Undefined value encountered");
                }
            }
        });
    });

    describe("delete", () => {
        it("should throw TypeORMError when criteria contains null", async () => {
            for (const dataSource of dataSources) {
                await prepareData(dataSource);
                try {
                    await dataSource.manager.delete(Post, { text: null });
                    expect.fail("Expected error to be thrown");
                } catch (error) {
                    expect(error).to.be.instanceOf(TypeORMError);
                    expect((error as TypeORMError).message).to.contain("Null value encountered");
                }
            }
        });

        it("should throw TypeORMError when criteria contains undefined", async () => {
            for (const dataSource of dataSources) {
                await prepareData(dataSource);
                try {
                    // @ts-expect-error - Testing runtime behavior with invalid undefined criteria
                    await dataSource.manager.delete(Post, { text: undefined });
                    expect.fail("Expected error to be thrown");
                } catch (error) {
                    expect(error).to.be.instanceOf(TypeORMError);
                    expect((error as TypeORMError).message).to.contain("Undefined value encountered");
                }
            }
        });
    });

    describe("softDelete", () => {
        it("should throw TypeORMError when criteria contains null", async () => {
            for (const dataSource of dataSources) {
                await prepareData(dataSource);
                try {
                    await dataSource.manager.softDelete(Post, { text: null });
                    expect.fail("Expected error to be thrown");
                } catch (error) {
                    expect(error).to.be.instanceOf(TypeORMError);
                    expect((error as TypeORMError).message).to.contain("Null value encountered");
                }
            }
        });

        it("should throw TypeORMError when criteria contains undefined", async () => {
            for (const dataSource of dataSources) {
                await prepareData(dataSource);
                try {
                    // @ts-expect-error - Testing runtime behavior with invalid undefined criteria
                    await dataSource.manager.softDelete(Post, { text: undefined });
                    expect.fail("Expected error to be thrown");
                } catch (error) {
                    expect(error).to.be.instanceOf(TypeORMError);
                    expect((error as TypeORMError).message).to.contain("Undefined value encountered");
                }
            }
        });
    });

    describe("restore", () => {
        it("should throw TypeORMError when criteria contains null", async () => {
            for (const dataSource of dataSources) {
                await prepareData(dataSource);
                try {
                    await dataSource.manager.restore(Post, { text: null });
                    expect.fail("Expected error to be thrown");
                } catch (error) {
                    expect(error).to.be.instanceOf(TypeORMError);
                    expect((error as TypeORMError).message).to.contain("Null value encountered");
                }
            }
        });

        it("should throw TypeORMError when criteria contains undefined", async () => {
            for (const dataSource of dataSources) {
                await prepareData(dataSource);
                try {
                    // @ts-expect-error - Testing runtime behavior with invalid undefined criteria
                    await dataSource.manager.restore(Post, { text: undefined });
                    expect.fail("Expected error to be thrown");
                } catch (error) {
                    expect(error).to.be.instanceOf(TypeORMError);
                    expect((error as TypeORMError).message).to.contain("Undefined value encountered");
                }
            }
        });
    });
});
