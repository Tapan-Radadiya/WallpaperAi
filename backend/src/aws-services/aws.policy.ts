export const getSignedUrlPolicy = (url: string, signedUrlTime: number = 60): string => {
    const expireTime = Math.floor((Date.now() + 60 * 1000) / 1000)
    const policy = {
        Statement: [
            {
                Resource: url,
                Condition: {
                    DateLessThan: {
                        "AWS:EpochTime": expireTime, // time in seconds
                    },
                },
            },
        ],
    };

    return JSON.stringify(policy)
}