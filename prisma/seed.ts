import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {
      phone: "+1234567890",
      password: hashedPassword,
      name: "Test User",
      bio: "This is a test user for development purposes.",
      role: "USER",
      emailVerified: new Date(), // Mark email as verified
    },
    create: {
      email: "test@example.com",
      phone: "+1234567890",
      password: hashedPassword,
      name: "Test User",
      bio: "This is a test user for development purposes.",
      role: "USER",
      emailVerified: new Date(), // Mark email as verified
    },
  });

  console.log("Created test user:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
