import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { projectPrisma } from "@/lib/project-prisma";
import AstrologyClient from "./client";
import { AstroUser } from "@/generated/project-client";

export default async function AstrologyPage() {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/astrology");
  }

  // Fetch astro_user data
  const astroUser = await projectPrisma.astroUser.findUnique({
    where: {
      id: session.user?.id,
    },
  });
  if (!astroUser) {
    redirect("/astrology/create");
  }
  return <AstrologyClient session={session} astroUser={astroUser as AstroUser} />;
}