import "reflect-metadata"
import { DataSource, Repository } from "../../../../src/index"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { expect } from "chai"
import { Image } from "./entity/Image"
import { File } from "./entity/File"

describe("persistence > delete orphans in one-to-one relation", () => {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connections: DataSource[] = []

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe("when a File is removed from a Image", () => {
        let imageRepository: Repository<Image>
        let fileRepository: Repository<File>
        let imageId: number

        beforeEach(async () => {
            await Promise.all(
                connections.map(async (connection) => {
                    imageRepository = connection.getRepository(Image)
                    fileRepository = connection.getRepository(File)
                }),
            )

            const imageToInsert = await imageRepository.save(new Image())
            imageToInsert.file = new File()

            await imageRepository.save(imageToInsert)
            imageId = imageToInsert.id

            const imageToUpdate = (await imageRepository.findOneBy({
                id: imageId,
            }))!
            imageToUpdate.file = new File()

            await imageRepository.save(imageToUpdate)
        })

        it("should retain a File on the Image", async () => {
            console.log("before select")
            const image = await imageRepository.findOneBy({
                id: imageId,
            })
            console.log("image", image)
            expect(image).not.to.be.undefined
            expect(image!.fileId).not.to.be.undefined
        })

        it("should delete the orphaned File from the database", async () => {
            const fileCount = await fileRepository.count()
            expect(fileCount).to.equal(1)
        })
    })
})
