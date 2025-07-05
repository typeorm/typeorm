import "reflect-metadata"
import { DataSource, DataSourceOptions } from "../../src/index"
import { Post } from "./entity/Post"

// Example configuration for local LibSQL database
const localOptions: DataSourceOptions = {
    type: "libsql",
    url: "file:local.db",
    logging: true,
    synchronize: true,
    entities: [Post],
}

// Example configuration for remote LibSQL database (e.g., Turso)
// Uncomment and modify to use remote database
/*
const remoteOptions: DataSourceOptions = {
    type: "libsql",
    url: "https://your-database-name.turso.io",
    authToken: "your-auth-token", // Required for remote connections
    logging: true,
    synchronize: true,
    entities: [Post],
}
*/

// Example configuration for embedded replica (syncing with remote)
// Uncomment and modify to use embedded replica
/*
const replicaOptions: DataSourceOptions = {
    type: "libsql",
    url: "file:replica.db",
    syncUrl: "https://your-database-name.turso.io",
    authToken: "your-auth-token",
    syncPeriod: 60, // Sync every 60 seconds
    readYourWrites: true,
    logging: true,
    synchronize: true,
    entities: [Post],
}
*/

async function main() {
    // Using local database for this example
    const dataSource = new DataSource(localOptions)

    try {
        await dataSource.initialize()
        console.log("Connected to LibSQL database")
    } catch (error) {
        console.log("Cannot connect to LibSQL database: ", error)
        return
    }

    const post = new Post()
    post.text = "Hello LibSQL!"
    post.title = "First LibSQL Post"
    post.likesCount = 42

    const postRepository = dataSource.getRepository(Post)

    try {
        await postRepository.save(post)
        console.log("Post has been saved to LibSQL: ", post)

        // Find all posts
        const allPosts = await postRepository.find()
        console.log("All posts from LibSQL: ", allPosts)
    } catch (error) {
        console.log("Cannot save or retrieve posts. Error: ", error)
    }

    await dataSource.destroy()
    console.log("LibSQL connection closed")
}

void main()
