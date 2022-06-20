export interface AzureActiveDirectoryMsiVmAuthentication {
    type: "azure-active-directory-msi-vm";
    options: {
        /**
         * If you user want to connect to an Azure app service using a specific client account
         * they need to provide `clientId` associate to their created identity.
         *
         * This is optional for retrieve token from azure web app service
         */
        clientId?: string;
        /**
         * A user need to provide `msiEndpoint` for retrieving the accesstoken.
         */
        msiEndpoint?: string;
    };
}
