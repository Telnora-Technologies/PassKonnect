import "dotenv/config";
import { prisma } from "../src/prisma.js";
import { hashPassword } from "../src/lib/auth.js";

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@passkonnect.dev").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true, passwordHash },
    create: { email, passwordHash, isAdmin: true },
  });

  console.log(`Admin user ready: ${admin.email} (isAdmin=${admin.isAdmin})`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`Using default password "ChangeMe123!" — set ADMIN_PASSWORD in .env to override.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
