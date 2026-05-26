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

