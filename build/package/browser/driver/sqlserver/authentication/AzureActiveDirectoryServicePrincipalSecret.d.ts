export interface AzureActiveDirectoryServicePrincipalSecret {
    type: "azure-active-directory-service-principal-secret";
    options: {
        /**
         * Application (`client`) ID from your registered Azure application
         */
        clientId: string;
        /**
         * The created `client secret` for this registered Azure application
         */
        clientSecret: string;
        /**
         * Directory (`tenant`) ID from your registered Azure application
         */
        tenantId: string;
    };
}
