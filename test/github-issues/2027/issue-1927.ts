import { Connection } from "../../../src/connection/Connection";
import {
  closeTestingConnections,
  createTestingConnections
} from "../../utils/test-utils";

import { File } from "./entity/File";
import { Collection } from "./entity/Collection";
import { CollectionFile } from "./entity/CollectionFile";

describe("github issues > #1927 Update fails for entity with composite key with repository", () => {
  let connections: Connection[];
  before(
    async () =>
      (connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"],
        schemaCreate: false,
        dropSchema: false
      }))
  );

  after(() => closeTestingConnections(connections));

  it("Should create a file, collection, and a collection_file.  Then lookup the collection_file, update it, and save it.", () =>
    Promise.all(
      connections.map(async connection => {
        //create a file
        let file = new File();
        file.id = "50eef808-473b-4131-8471-4ce2103b3be1";
        let fileRepo = await connection.getRepository(File);
        await fileRepo.save(file);

        //create a collection
        let collection = new Collection();
        collection.id = "62dd760d-a6b5-4662-a82d-46ab36b0c6a5";
        let collectionRepo = await connection.getRepository(Collection);
        await collectionRepo.save(collection);

        //create a file in a collection
        let collectionFile = new CollectionFile();
        collectionFile.file = file;
        collectionFile.collection = collection;
        collectionFile.sort = 1;
        const collectionFileRepo = await connection.getRepository(
          CollectionFile
        );
        await collectionFileRepo.save(collectionFile);

        //lookup the saved file in collection
        let foundCollectionFile = await collectionFileRepo.findOne({
          collection: collection,
          file: file
        });

        console.log(foundCollectionFile);
        //attempt to update the file in the collection
        if (foundCollectionFile) {
          foundCollectionFile.sort = 10;
          await collectionFileRepo.save(foundCollectionFile);
        }
      })
    ));
});
