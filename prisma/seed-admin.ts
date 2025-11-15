import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting admin user seeding...");

  // Hash the password for admin
  const adminPassword = await bcrypt.hash("Admin@2024", 10);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@foreverpages.online" },
    update: {
      phone: "+2348000000000",
      password: adminPassword,
      name: "Admin User",
      bio: "Administrator account for ForeverPages.",
      role: "ADMIN",
      emailVerified: new Date(), // Mark email as verified
    },
    create: {
      email: "admin@foreverpages.online",
      phone: "+2348000000000",
      password: adminPassword,
      name: "Admin User",
      bio: "Administrator account for ForeverPages.",
      role: "ADMIN",
      emailVerified: new Date(), // Mark email as verified
    },
  });

  console.log("✅ Successfully created/updated admin user:");
  console.log("   Email:", adminUser.email);
  console.log("   Name:", adminUser.name);
  console.log("   Role:", adminUser.role);
  console.log("   Phone:", adminUser.phone);
  console.log("   Verified:", adminUser.emailVerified ? "Yes" : "No");
  console.log("\n📝 Login Credentials:");
  console.log("   Email: admin@foreverpages.online");
  console.log("   Password: Admin@2024");
  console.log("\n🔗 Access admin dashboard at: /admin");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
