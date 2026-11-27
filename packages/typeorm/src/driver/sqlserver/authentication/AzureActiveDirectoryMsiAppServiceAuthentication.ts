export interface AzureActiveDirectoryMsiAppServiceAuthentication {
    type: "azure-active-directory-msi-app-service"
    options: {
        /**
         * If you user want to connect to an Azure app service using a specific client account
         * they need to provide `clientId` associate to their created identity.
         *
         * This is optional for retrieve token from azure web app service
         */
        clientId?: string
        /**
         * A msi app service environment need to provide `msiEndpoint` for retriving the accesstoken.
         */
        msiEndpoint?: string
        /**
         * A msi app service environment need to provide `msiSecret` for retrieved the accesstoken.
         */
        msiSecret?: string
    }
}
