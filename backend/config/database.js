import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function connectDB() {
    try {
        await prisma.$connect();
        console.log("Connected to PostgreSQL");
    } catch (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
}

export default prisma;
