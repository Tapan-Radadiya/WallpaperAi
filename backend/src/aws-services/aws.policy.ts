export const getSignedUrlPolicy = (url): string => {
    const policy = {
        Statement: [
            {
                Resource: url,
                Condition: {
                    DateLessThan: {
                        "AWS:EpochTime": new Date(Date.now() + 60 * 1000).toISOString(), // time in seconds
                    },
                },
            },
        ],
    };

    return JSON.stringify(policy)
}