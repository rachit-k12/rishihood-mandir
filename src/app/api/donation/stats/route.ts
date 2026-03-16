import { NextResponse } from "next/server";
import { getDonationStats } from "@/lib/db";
import { DONATION_TARGET } from "@/lib/constants";

export async function GET() {
  try {
    const stats = await getDonationStats();
    return NextResponse.json(
      {
        totalCollected: stats.totalCollected,
        target: DONATION_TARGET,
        count: stats.count,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch donation stats:", error);
    return NextResponse.json(
      { totalCollected: 0, target: DONATION_TARGET, count: 0 },
      { status: 500 }
    );
  }
}
