export interface AzureActiveDirectoryDefaultAuthentication {
    /**
     * This uses DefaultAzureCredential from @azure/identity to try multiple methods of authentication
     */
    type: "azure-active-directory-default"
    options: {
        /**
         * The clientId of the user you want to log in with, mapped to the managedIdentityClientId in tedious
         */
        clientId?: string
    }
}
