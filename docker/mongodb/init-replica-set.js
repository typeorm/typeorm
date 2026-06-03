const config = {
    _id: "rs0",
    members: [{ _id: 0, host: "localhost:27017" }],
}

try {
    const status = rs.status()
    if (status.ok === 1) {
        print("MongoDB replica set already initialized")
    } else {
        print("MongoDB replica set status is not ready yet")
    }
} catch (error) {
    print("Initializing MongoDB replica set for TypeORM tests")
    rs.initiate(config)
}

// Wait until the replica set reaches writable PRIMARY state
// This ensures transactions are properly usable
let attempts = 0
const maxAttempts = 30
while (attempts < maxAttempts) {
    try {
        const helloResponse = db.hello()
        if (helloResponse.isWritablePrimary) {
            print("MongoDB replica set is now a writable PRIMARY")
            break
        }
    } catch (e) {
        // Replica set not ready yet
    }
    attempts++
    if (attempts < maxAttempts) {
        sleep(1000)
    }
}

if (attempts >= maxAttempts) {
    print("ERROR: MongoDB replica set did not reach writable PRIMARY state after 30 seconds")
    quit(1)
}
