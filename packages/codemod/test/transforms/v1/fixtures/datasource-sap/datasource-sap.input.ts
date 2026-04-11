import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "sap",
    hanaClientDriver: "hdb",
    pool: {
        max: 10,
        requestTimeout: 5000,
        idleTimeout: 30000,
    },
})
