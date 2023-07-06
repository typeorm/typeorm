export interface AzureActiveDirectoryAccessTokenAuthentication {
    type: "azure-active-directory-access-token";
    options: {
        /**
         * A user need to provide `token` which they retrived else where
         * to forming the connection.
         */
        token: string;
    };
}
