import "reflect-metadata";

import { expect } from "chai";

import { Connection } from "../../../../src/connection/Connection";
import { Repository } from "../../../../src/repository/Repository";
import {
  closeTestingConnections,
  createTestingConnections,
  reloadTestingDatabases
} from "../../../utils/test-utils";
import { Category } from "./entity/Category";
import { CategoryMetadata } from "./entity/CategoryMetadata";
import { Post } from "./entity/Post";

describe("persistence > custom-column-names", function() {
  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  // connect to db
  let connections: Connection[];
  before(
    async () =>
      (connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["mysql"]
      }))
  );
  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  let postRepository: Repository<Post>;
  let categoryRepository: Repository<Category>;
  let metadataRepository: Repository<CategoryMetadata>;
  // -------------------------------------------------------------------------
  // Specifications
  // -------------------------------------------------------------------------

  it("attach exist entity to exist entity with many-to-one relation", () =>
    Promise.all(
      connections.map(async connection => {
        postRepository = connection.getRepository(Post);
        categoryRepository = connection.getRepository(Category);
        metadataRepository = connection.getRepository(CategoryMetadata);

        // save a new category
        const newCategory = await categoryRepository.create();
        newCategory.name = "Animals";
        await categoryRepository.save(newCategory);

        // save a new post
        const newPost = await postRepository.create();
        newPost.title = "All about animals";
        await postRepository.save(newPost);

        // attach category to post and save it
        newPost.category = newCategory;
        await postRepository.save(newPost);

        // load a post
        const loadedPost = await postRepository.findOne(1, {
          join: {
            alias: "post",
            leftJoinAndSelect: { category: "post.category" }
          }
        });
        expect(loadedPost).not.to.be.empty;
        expect(loadedPost).to.have.property("category");
        expect(loadedPost).to.have.property("categoryId");
      })
    ));

  it("attach new entity to exist entity with many-to-one relation", () =>
    Promise.all(
      connections.map(async connection => {
        postRepository = connection.getRepository(Post);
        categoryRepository = connection.getRepository(Category);
        metadataRepository = connection.getRepository(CategoryMetadata);

        // save a new category
        const newCategory = await categoryRepository.create();
        newCategory.name = "Animals";
        await categoryRepository.save(newCategory);

        // save a new post and attach category
        const newPost = await postRepository.create();
        newPost.title = "All about animals";
        newPost.category = newCategory;
        await postRepository.save(newPost);

        // load a post
        const loadedPost = await postRepository.findOne(1, {
          join: {
            alias: "post",
            leftJoinAndSelect: { category: "post.category" }
          }
        });

        expect(loadedPost).not.to.be.empty;
        expect(loadedPost).to.have.property("category");
        expect(loadedPost).to.have.property("categoryId");
      })
    ));

  it("attach new entity to new entity with many-to-one relation", () =>
    Promise.all(
      connections.map(async connection => {
        postRepository = connection.getRepository(Post);
        categoryRepository = connection.getRepository(Category);
        metadataRepository = connection.getRepository(CategoryMetadata);

        // save a new category, post and attach category to post
        const newCategory = await categoryRepository.create();
        newCategory.name = "Animals";
        const newPost = await postRepository.create();
        newPost.title = "All about animals";
        newPost.category = newCategory;
        await postRepository.save(newPost);

        // load a post
        const loadedPost = await postRepository.findOne(1, {
          join: {
            alias: "post",
            leftJoinAndSelect: { category: "post.category" }
          }
        });

        expect(loadedPost).not.to.be.empty;
        expect(loadedPost).to.have.property("category");
        expect(loadedPost).to.have.property("categoryId");
      })
    ));

  it("attach exist entity to exist entity with one-to-one relation", () =>
    Promise.all(
      connections.map(async connection => {
        postRepository = connection.getRepository(Post);
        categoryRepository = connection.getRepository(Category);
        metadataRepository = connection.getRepository(CategoryMetadata);

        // save a new post
        const newPost = await postRepository.create();
        newPost.title = "All about animals";
        await postRepository.save(newPost);

        // save a new category
        const newCategory = await categoryRepository.create();
        newCategory.name = "Animals";
        await categoryRepository.save(newCategory);

        // save a new metadata
        const newMetadata = await metadataRepository.create();
        newMetadata.keyword = "animals";
        await metadataRepository.save(newMetadata);

        // attach metadata to category and category to post and save it
        newCategory.metadata = newMetadata;
        newPost.category = newCategory;
        await postRepository.save(newPost);

        // load a post
        const loadedPost = await postRepository.findOne(1, {
          join: {
            alias: "post",
            leftJoinAndSelect: {
              category: "post.category",
              metadata: "category.metadata"
            }
          }
        });

        expect(loadedPost).not.to.be.empty;
        expect(loadedPost).to.have.property("category");
        expect(loadedPost).to.have.property("categoryId");
        expect(loadedPost).to.have.deep.property("category.metadata");
        expect(loadedPost).to.have.deep.property("category.metadataId");
      })
    ));

  it("attach new entity to exist entity with one-to-one relation", () =>
    Promise.all(
      connections.map(async connection => {
        postRepository = connection.getRepository(Post);
        categoryRepository = connection.getRepository(Category);
        metadataRepository = connection.getRepository(CategoryMetadata);

        // save a new post
        const newPost = await postRepository.create();
        newPost.title = "All about animals";
        await postRepository.save(newPost);

        // save a new category and new metadata
        const newMetadata = await metadataRepository.create();
        newMetadata.keyword = "animals";
        const newCategory = await categoryRepository.create();
        newCategory.name = "Animals";
        newCategory.metadata = newMetadata;
        await categoryRepository.save(newCategory);

        // attach metadata to category and category to post and save it
        newPost.category = newCategory;
        await postRepository.save(newPost);

        // load a post
        const loadedPost = await postRepository.findOne(1, {
          join: {
            alias: "post",
            leftJoinAndSelect: {
              category: "post.category",
              metadata: "category.metadata"
            }
          }
        });

        expect(loadedPost).not.to.be.empty;
        expect(loadedPost).to.have.property("category");
        expect(loadedPost).to.have.property("categoryId");
        expect(loadedPost).to.have.deep.property("category.metadata");
        expect(loadedPost).to.have.deep.property("category.metadataId");
      })
    ));
});
