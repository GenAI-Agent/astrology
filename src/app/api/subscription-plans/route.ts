import { NextRequest, NextResponse } from "next/server";
import { userPrisma } from "@/lib/prisma-multi";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lensViewId = searchParams.get("lensViewId");

    if (!lensViewId) {
      return NextResponse.json(
        { error: "lensViewId parameter is required" },
        { status: 400 }
      );
    }

    // Fetch subscription plans for the specified lens
    const subscriptionPlans = await userPrisma.subscriptionPlan.findMany({
      where: {
        lensViewId: lensViewId,
        status: 1, // Active plans only
      },
      include: {
        lens: {
          select: {
            viewId: true,
            name: true,
          },
        },
      },
      orderBy: {
        price: "asc",
      },
    });

    // // Transform database format to UI format
    // const transformedPlans = subscriptionPlans.map((plan: any) => {
    //   // Parse features and description if they are JSON
    //   let features: string[] = [];
    //   let description = plan.description;

    //   if (typeof plan.features === "object" && plan.features !== null) {
    //     features = plan.features as string[];
    //   }

    //   if (typeof plan.description === "object" && plan.description !== null) {
    //     description = (plan.description as any).text || plan.name;
    //   }

    //   return {
    //     id: plan.viewId,
    //     name: plan.name,
    //     price: plan.price,
    //     currency: plan.currency,
    //     period: plan.type === "monthly" ? "month" : plan.type,
    //     description: description as string,
    //     features: features,
    //     limitations: [], // Add limitations logic if needed
    //     isPopular: plan.isPopular,
    //     savings: plan.discountMonthly
    //       ? `Save ${plan.discountMonthly}%`
    //       : undefined,
    //   };
    // });

    return NextResponse.json(subscriptionPlans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}
