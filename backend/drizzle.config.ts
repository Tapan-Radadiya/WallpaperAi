import { config } from "dotenv";
import { defineConfig } from "drizzle-kit"
config({ path: `${process.env.NODE_ENV === 'PROD' ? '.env' : '.env.dev'}` })


console.log("process.env.DATABASE_URL", process.env.DATABASE_URL)
export default defineConfig({
    schema: './src/Schema/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!
    }
})