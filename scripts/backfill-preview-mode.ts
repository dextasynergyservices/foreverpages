import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.template.findMany({ select: { id: true, manifest: true } });
  for (const tpl of templates) {
    const manifest = tpl.manifest as unknown as Record<string, unknown> | null;
    let mode: "AUTO" | "IFRAME" | "STATIC" = "AUTO";
    try {
      if (manifest) {
        const pm = (manifest.previewMode as string) || (manifest.preview_mode as string) || "";
        const norm = String(pm).toLowerCase();
        if (norm === "static") mode = "STATIC";
        else if (norm === "iframe") mode = "IFRAME";
      }
    } catch {
      // ignore and leave AUTO
    }

    // prisma client accepts the string enum value directly
    await prisma.template.update({
      where: { id: tpl.id },
      data: { previewMode: mode },
    });
    console.log(`Updated template ${tpl.id} -> ${mode}`);
  }
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? (e.stack ?? e.message) : String(e));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
