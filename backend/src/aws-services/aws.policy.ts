export const getSignedUrlPolicy = (url): string => {
    const dateLessThan = "2028-01-01";
    const policy = {
        Statement: [
            {
                Resource: url,
                Condition: {
                    DateLessThan: {
                        "AWS:EpochTime": new Date(dateLessThan).getTime() / 1000, // time in seconds
                    },
                },
            },
        ],
    };

    return JSON.stringify(policy)
}