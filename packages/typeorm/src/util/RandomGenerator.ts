export class RandomGenerator {
    /**
     * Generates a RFC 4122 version 4 UUID.
     * Uses native crypto.randomUUID() if available, otherwise falls back to
     * a custom implementation using crypto.getRandomValues().
     *
     * @returns A version 4 UUID string
     */
    static uuidv4(): string {
        const crypto = globalThis.crypto as typeof globalThis.crypto | undefined

        // Try native crypto.randomUUID() (available in Node.js 19+ and modern browsers)
        const uuid = crypto?.randomUUID?.()
        if (uuid) {
            return uuid
        }

        // Custom implementation using crypto.getRandomValues()
        // Based on RFC 4122 version 4 UUID specification
        const randomBytes = new Uint8Array(16)

        if (crypto?.getRandomValues) {
            crypto.getRandomValues(randomBytes)
        } else {
            // Fallback for React Native/Hermes and environments without crypto support
            // Hermes (React Native's JavaScript engine) does not provide crypto APIs
            // Math.random() is permitted by RFC 4122 for UUID v4 ("pseudo-randomly")
            // This approach is also used by expo-crypto and other RN libraries
            // Note: For TypeORM's use case (DB IDs, cache IDs), uniqueness is sufficient
            for (let i = 0; i < 16; i++) {
                randomBytes[i] = Math.floor(Math.random() * 256)
            }
        }

        // Set version (4) and variant bits according to RFC 4122
        randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40 // Version 4
        randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80 // Variant 10

        // Convert to UUID string format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
        const hexValues: string[] = []
        randomBytes.forEach((byte) => {
            hexValues.push(byte.toString(16).padStart(2, "0"))
        })

        return [
            hexValues.slice(0, 4).join(""),
            hexValues.slice(4, 6).join(""),
            hexValues.slice(6, 8).join(""),
            hexValues.slice(8, 10).join(""),
            hexValues.slice(10, 16).join(""),
        ].join("-")
    }

    /**
     * Standard-conforming SHA-1 polyfill, based on http://locutus.io/php/sha1/
     *
     * @param str String to be hashed.
     * @returns SHA-1 hex digest
     */
    static sha1(str: string) {
        const _rotLeft = function (n: number, s: number): number {
            const t4 = (n << s) | (n >>> (32 - s))
            return t4
        }

        const _cvtHex = function (val: number): string {
            let str = ""

            for (let i = 7; i >= 0; i--) {
                const v = (val >>> (i * 4)) & 0x0f
                str += v.toString(16)
            }
            return str
        }

        // utf8_encode
        const bytes = new TextEncoder().encode(str)
        const bytesLength = bytes.length

        const wordArray: number[] = []
        for (let i = 0; i < bytesLength - 3; i += 4) {
            const j =
                (bytes[i] << 24) |
                (bytes[i + 1] << 16) |
                (bytes[i + 2] << 8) |
                bytes[i + 3]
            wordArray.push(j)
        }

        let i: number = 0
        switch (bytesLength % 4) {
            case 0:
                i = 0x080000000
                break
            case 1:
                i = (bytes[bytesLength - 1] << 24) | 0x0800000
                break
            case 2:
                i =
                    (bytes[bytesLength - 2] << 24) |
                    (bytes[bytesLength - 1] << 16) |
                    0x08000
                break
            case 3:
                i =
                    (bytes[bytesLength - 3] << 24) |
                    (bytes[bytesLength - 2] << 16) |
                    (bytes[bytesLength - 1] << 8) |
                    0x80
                break
        }

        wordArray.push(i)

        while (wordArray.length % 16 !== 14) {
            wordArray.push(0)
        }

        wordArray.push(bytesLength >>> 29)
        wordArray.push((bytesLength << 3) & 0x0ffffffff)

        let H0 = 0x67452301
        let H1 = 0xefcdab89
        let H2 = 0x98badcfe
        let H3 = 0x10325476
        let H4 = 0xc3d2e1f0

        for (
            let blockstart = 0;
            blockstart < wordArray.length;
            blockstart += 16
        ) {
            const W: number[] = new Array(80)
            for (let i = 0; i < 16; i++) {
                W[i] = wordArray[blockstart + i]
            }
            for (let i = 16; i <= 79; i++) {
                W[i] = _rotLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1)
            }

            let A = H0
            let B = H1
            let C = H2
            let D = H3
            let E = H4

            for (let i = 0; i <= 19; i++) {
                const temp =
                    (_rotLeft(A, 5) +
                        ((B & C) | (~B & D)) +
                        E +
                        W[i] +
                        0x5a827999) &
                    0x0ffffffff
                E = D
                D = C
                C = _rotLeft(B, 30)
                B = A
                A = temp
            }

            for (let i = 20; i <= 39; i++) {
                const temp =
                    (_rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ed9eba1) &
                    0x0ffffffff
                E = D
                D = C
                C = _rotLeft(B, 30)
                B = A
                A = temp
            }

            for (let i = 40; i <= 59; i++) {
                const temp =
                    (_rotLeft(A, 5) +
                        ((B & C) | (B & D) | (C & D)) +
                        E +
                        W[i] +
                        0x8f1bbcdc) &
                    0x0ffffffff
                E = D
                D = C
                C = _rotLeft(B, 30)
                B = A
                A = temp
            }

            for (let i = 60; i <= 79; i++) {
                const temp =
                    (_rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0xca62c1d6) &
                    0x0ffffffff
                E = D
                D = C
                C = _rotLeft(B, 30)
                B = A
                A = temp
            }

            H0 = (H0 + A) & 0x0ffffffff
            H1 = (H1 + B) & 0x0ffffffff
            H2 = (H2 + C) & 0x0ffffffff
            H3 = (H3 + D) & 0x0ffffffff
            H4 = (H4 + E) & 0x0ffffffff
        }

        const ans =
            _cvtHex(H0) + _cvtHex(H1) + _cvtHex(H2) + _cvtHex(H3) + _cvtHex(H4)
        return ans.toLowerCase()
    }

    /**
     * Standard-conforming SHA-256 implementation (FIPS 180-4), used in
     * environments where node's crypto module is unavailable.
     *
     * @param str String to be hashed.
     * @returns SHA-256 hex digest
     */
    static sha256(str: string): string {
        const roundConstants = new Uint32Array([
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
            0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
            0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
            0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
            0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
            0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
            0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
            0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
            0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
            0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
            0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
            0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
        ])
        const rotateRight = (value: number, amount: number): number =>
            (value >>> amount) | (value << (32 - amount))

        const bytes = new TextEncoder().encode(str)
        const bitLengthLow = (bytes.length << 3) >>> 0
        const bitLengthHigh = Math.floor(bytes.length / 0x20000000)
        const paddedLength = (((bytes.length + 8) >> 6) + 1) << 6
        const padded = new Uint8Array(paddedLength)
        padded.set(bytes)
        padded[bytes.length] = 0x80
        const view = new DataView(padded.buffer)
        view.setUint32(paddedLength - 8, bitLengthHigh)
        view.setUint32(paddedLength - 4, bitLengthLow)

        const hash = new Uint32Array([
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f,
            0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
        ])
        const schedule = new Uint32Array(64)

        for (let offset = 0; offset < paddedLength; offset += 64) {
            for (let i = 0; i < 16; i++) {
                schedule[i] = view.getUint32(offset + i * 4)
            }
            for (let i = 16; i < 64; i++) {
                const s0 =
                    rotateRight(schedule[i - 15], 7) ^
                    rotateRight(schedule[i - 15], 18) ^
                    (schedule[i - 15] >>> 3)
                const s1 =
                    rotateRight(schedule[i - 2], 17) ^
                    rotateRight(schedule[i - 2], 19) ^
                    (schedule[i - 2] >>> 10)
                schedule[i] =
                    (schedule[i - 16] + s0 + schedule[i - 7] + s1) >>> 0
            }

            let [a, b, c, d, e, f, g, h] = hash
            for (let i = 0; i < 64; i++) {
                const s1 =
                    rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)
                const ch = (e & f) ^ (~e & g)
                const temp1 =
                    (h + s1 + ch + roundConstants[i] + schedule[i]) >>> 0
                const s0 =
                    rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)
                const maj = (a & b) ^ (a & c) ^ (b & c)
                const temp2 = (s0 + maj) >>> 0
                h = g
                g = f
                f = e
                e = (d + temp1) >>> 0
                d = c
                c = b
                b = a
                a = (temp1 + temp2) >>> 0
            }

            hash[0] = (hash[0] + a) >>> 0
            hash[1] = (hash[1] + b) >>> 0
            hash[2] = (hash[2] + c) >>> 0
            hash[3] = (hash[3] + d) >>> 0
            hash[4] = (hash[4] + e) >>> 0
            hash[5] = (hash[5] + f) >>> 0
            hash[6] = (hash[6] + g) >>> 0
            hash[7] = (hash[7] + h) >>> 0
        }

        return Array.from(hash)
            .map((value) => value.toString(16).padStart(8, "0"))
            .join("")
    }
}
