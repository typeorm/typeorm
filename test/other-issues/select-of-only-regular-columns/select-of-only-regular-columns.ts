import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import {Post} from "./entity/Post"
import { expect } from "chai"

describe("other issues > redundant cascade schema queries in many-to-many relation", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Post],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should return objects without selected primary keys", () =>
        Promise.all(dataSources.map(async (dataSource) => {
            const repository = dataSource.getRepository(Post);
            await repository.save([{title: "test", numberOfLikes: 42}, {title: "post title", numberOfLikes: 34}, {title: "third post", numberOfLikes: 87 }]);
            
            expect(await repository.find({select: {id: true, title: true, numberOfLikes: true}})).to.deep.equal([
                {id: 1, title: "test", numberOfLikes: 42},
                {id: 2, title: "post title", numberOfLikes: 34},
                {id: 3, title: "third post", numberOfLikes: 87},
            ]);

            expect(await repository.find({select: {title: true, numberOfLikes: true}})).to.deep.equal([
                {title: "test", numberOfLikes: 42},
                {title: "post title", numberOfLikes: 34},
                {title: "third post", numberOfLikes: 87},
            ]);

            expect(await repository.find({select: {title: true}})).to.deep.equal([
                {title: "test"},
                {title: "post title"},
                {title: "third post"},
            ]);

            expect(await repository.find({select: {numberOfLikes: true}})).to.deep.equal([
                {numberOfLikes: 42},
                {numberOfLikes: 34},
                {numberOfLikes: 87},
            ]);

            expect(await repository.createQueryBuilder("post").select(["post.id", "post.title", "post.number_of_likes"]).getMany()).to.deep.equal([
                {id: 1, title: "test", numberOfLikes: 42},
                {id: 2, title: "post title", numberOfLikes: 34},
                {id: 3, title: "third post", numberOfLikes: 87},
            ]);

            expect(await repository.createQueryBuilder("post").select(["post.title", "post.number_of_likes"]).getMany()).to.deep.equal([
                {title: "test", numberOfLikes: 42},
                {title: "post title", numberOfLikes: 34},
                {title: "third post", numberOfLikes: 87},
            ]);

            expect(await repository.createQueryBuilder("post").select("post.title").getMany()).to.deep.equal([
                {title: "test"},
                {title: "post title"},
                {title: "third post"},
            ]);

            expect(await repository.createQueryBuilder("post").select("post.number_of_likes").getMany()).to.deep.equal([
                {numberOfLikes: 42},
                {numberOfLikes: 34},
                {numberOfLikes: 87},
            ]);
        })))
})
