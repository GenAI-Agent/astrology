import { NextRequest, NextResponse } from "next/server";
import { projectPrisma } from "@/lib/project-prisma";

// POST - Export datasets based on IDs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, format = "json" } = body;

    let whereClause = {};
    if (ids && ids.length > 0) {
      whereClause = {
        id: {
          in: ids,
        },
      };
    }

    const datasets = await projectPrisma.astroDataset.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (format === "csv") {
      // Convert to CSV format
      const headers = [
        "id",
        "promptTemplate",
        "history",
        "toolResult",
        "userInput",
        "modelAnswer",
        "tristanAnswer",
        "modelScore",
        "tristanScore",
        "createdAt",
        "updatedAt",
      ];

      const csvContent = [
        headers.join(","),
        ...datasets.map((dataset) =>
          [
            dataset.id,
            `"${dataset.promptTemplate.replace(/"/g, '""')}"`,
            `"${dataset.history.replace(/"/g, '""')}"`,
            `"${dataset.toolResult.replace(/"/g, '""')}"`,
            `"${dataset.userInput.replace(/"/g, '""')}"`,
            `"${dataset.modelAnswer.replace(/"/g, '""')}"`,
            `"${dataset.tristanAnswer?.replace(/"/g, '""') || ""}"`,
            dataset.modelScore || "",
            dataset.tristanScore || "",
            dataset.createdAt.toISOString(),
            dataset.updatedAt.toISOString(),
          ].join(",")
        ),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="astro_dataset_export_${new Date().toISOString()}.csv"`,
        },
      });
    } else if (format === "jsonl") {
      // Convert to JSONL format (one JSON object per line)
      const jsonlContent = datasets
        .map((dataset) => {
          // Ensure all string fields are properly handled
          const cleanData = {
            id: dataset.id,
            promptTemplate: dataset.promptTemplate || "",
            history: dataset.history || "",
            toolResult: dataset.toolResult || "",
            userInput: dataset.userInput || "",
            modelAnswer: dataset.modelAnswer || "",
            tristanAnswer: dataset.tristanAnswer || "",
            modelScore: dataset.modelScore || null,
            tristanScore: dataset.tristanScore || null,
            createdAt: dataset.createdAt.toISOString(),
            updatedAt: dataset.updatedAt.toISOString(),
          };
          
          // Use JSON.stringify to ensure proper escaping
          // This will handle all special characters, newlines, etc.
          return JSON.stringify(cleanData);
        })
        .join("\n");

      // Add a final newline for proper JSONL format
      const finalContent = jsonlContent + (jsonlContent ? "\n" : "");

      return new NextResponse(finalContent, {
        headers: {
          "Content-Type": "application/x-ndjson",
          "Content-Disposition": `attachment; filename="astro_dataset_export_${new Date().toISOString()}.jsonl"`,
        },
      });
    }

    // Default to JSON format
    return NextResponse.json({
      success: true,
      data: datasets,
      count: datasets.length,
    });
  } catch (error) {
    console.error("Error exporting astro datasets:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
