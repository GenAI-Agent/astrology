import { NextRequest, NextResponse } from "next/server";
import { projectPrisma } from "@/lib/project-prisma";

// GET - Get single dataset by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const dataset = await projectPrisma.astroDataset.findUnique({
      where: {
        id: id,
      },
    });

    if (!dataset) {
      return NextResponse.json(
        {
          success: false,
          message: "Dataset not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    console.error("Error fetching astro dataset:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update dataset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    // Only allow updating specific fields
    const updateData: any = {};
    if (body.tristanAnswer !== undefined)
      updateData.tristanAnswer = body.tristanAnswer;
    if (body.tristanScore !== undefined)
      updateData.tristanScore = body.tristanScore;
    if (body.modelScore !== undefined) updateData.modelScore = body.modelScore;

    const dataset = await projectPrisma.astroDataset.update({
      where: {
        id: id,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    console.error("Error updating astro dataset:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete dataset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await projectPrisma.astroDataset.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dataset deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting astro dataset:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
