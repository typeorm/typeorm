/**
 * Anonymous
 *
 * Empty token passed in a request
 */
export interface AnonymousAuthOptions {
    type: "anonymous"
}

/**
 * Access Token
 *
 * Fixed token set as a parameter for the client (SDK or CLI) and passed in requests.
 */
export interface TokenAuthOptions {
    type: "token"
    token: string
}

/**
 * Service Account Authentication
 *
 * Service account attributes and a signature key set as parameters for the client (SDK or CLI), which the client periodically sends to the IAM API in the background to rotate a token (obtain a new one) to pass in requests.
 */
export interface IamAuthOptions {
    type: "IAM"
    serviceAccountId: string
    accessKeyId: string
    privateKey: Buffer
    iamEndpoint: string
    sslCredentials?: {
        rootCertificates?: Buffer
        clientPrivateKey?: Buffer
        clientCertChain?: Buffer
    }
}

/**
 * Metadata
 *
 * Client (SDK or CLI) periodically accesses a local service to rotate a token (obtain a new one) to pass in requests
 */
export interface MetadataAuthOptions {
    type: "metadata"

    /**
     * MetadataTokenService object
     *
     * This defaults to {MetadataTokenService} from '@yandex-cloud/nodejs-sdk'
     */
    metadataTokenService?: any
}
