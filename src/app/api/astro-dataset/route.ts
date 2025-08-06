import { NextRequest, NextResponse } from "next/server";
import { projectPrisma } from "@/lib/project-prisma";

// GET - List all datasets with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [datasets, total] = await Promise.all([
      projectPrisma.astroDataset.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      projectPrisma.astroDataset.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: datasets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching astro datasets:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST - Create new dataset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const dataset = await projectPrisma.astroDataset.create({
      data: {
        userId: body.userId,
        promptTemplate: body.promptTemplate,
        history: body.history,
        toolResult: body.toolResult,
        userInput: body.userInput,
        modelAnswer: body.modelAnswer,
        tristanAnswer: body.tristanAnswer,
        modelScore: body.modelScore || null,
        tristanScore: body.tristanScore || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: dataset,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating astro dataset:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
