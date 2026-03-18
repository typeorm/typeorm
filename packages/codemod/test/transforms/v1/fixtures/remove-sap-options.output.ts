const dataSource = new DataSource({
    type: "sap",
    driver: "hdb",
    pool: {
        maxConnectedOrPooled: 10,
        maxWaitTimeoutIfPoolExhausted: 5000,
        maxPooledIdleTime: 30000,
    },
})
