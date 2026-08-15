export const ALLOWED_EMAILS_DOMAINS = [
    "gmail.com",
    "googlemail.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "yahoo.com",
    "icloud.com",
    "proton.me",
    "protonmail.com",
];

export const ALLOWED_IMAGES = [
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/webp"
]

export const ALLOWED_IMAGES_FORMAT = ["jpeg", "jpg", "png", "webp"]

export const DRIZZLE = Symbol("drizzle-connection")

export const IMAGE_USER_OWNER_TYPE = {
    "PURCHASED": "PURCHASED",
    "UPLOADED": "UPLOADED"
}

export const USER_PURCHASED_IMAGES_SIGNED_URL_EXPIRE_TIME = 3600 // 1 Hour

export const USER_PURCHASED_IMAGES_CACHE_TIME = 3400 // 0.94 Hour