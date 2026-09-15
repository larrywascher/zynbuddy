import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ votes: {} });
  }

  const { searchParams } = new URL(req.url);
  const priceIds = searchParams.get("priceIds");
  if (!priceIds) {
    return NextResponse.json({ votes: {} });
  }

  const ids = priceIds.split(",").filter(Boolean).slice(0, 50);

  const votes = await prisma.priceVote.findMany({
    where: {
      userId: session.user.id,
      priceReportId: { in: ids },
    },
    select: { priceReportId: true, voteType: true },
  });

  const voteMap: Record<string, string> = {};
  for (const v of votes) {
    voteMap[v.priceReportId] = v.voteType;
  }

  return NextResponse.json({ votes: voteMap });
}
