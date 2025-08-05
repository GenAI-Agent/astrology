import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { projectPrisma } from "@/lib/prisma-multi";
import { S3Service } from "@/lib/s3-service";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "file";
    const url = formData.get("url") as string;

    // 處理 URL 類型的上傳
    if (type === "url" && url) {
      const fileId = uuidv4();

      const uploadedFile = await projectPrisma.uploadedFile.create({
        data: {
          id: fileId,
          user_id: session.user.id,
          file_name: url,
          file_path: url,
          type: "url",
        },
      });

      return NextResponse.json({
        success: true,
        uploadedFile,
      });
    }

    // 處理文件上傳
    if (!file) {
      return NextResponse.json({ error: "沒有找到文件" }, { status: 400 });
    }

    // 檢查文件大小 (限制 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "文件大小不能超過 50MB" },
        { status: 400 }
      );
    }

    // 檢查文件類型
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "text/csv",
      "application/json",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "不支持的文件類型。支持的類型：PDF, DOCX, DOC, TXT, CSV, JSON",
        },
        { status: 400 }
      );
    }

    const fileId = uuidv4();
    const fileExtension = file.name.split(".").pop() || "bin";
    const fileName = `${fileId}.${fileExtension}`;
    const s3Key = `${session.user.id}/uploads/${fileName}`;

    try {
      // 上傳文件到 S3
      const s3Service = new S3Service();
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      // 創建上傳命令
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || "ap-northeast-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
      });

      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || "lens-audio",
        Key: s3Key,
        Body: fileBuffer,
        ContentType: file.type,
        Metadata: {
          originalName: encodeURIComponent(file.name),
          userId: session.user.id,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      // 創建數據庫記錄
      const uploadedFile = await projectPrisma.uploadedFile.create({
        data: {
          id: fileId,
          user_id: session.user.id,
          file_name: file.name,
          file_path: `s3://lens-audio/${s3Key}`,
          type: getFileType(file.type),
        },
      });

      return NextResponse.json({
        success: true,
        uploadedFile,
      });
    } catch (error) {
      console.error("上傳文件到 S3 時出錯:", error);
      return NextResponse.json({ error: "上傳文件失敗" }, { status: 500 });
    }
  } catch (error) {
    console.error("處理文件上傳時出錯:", error);
    return NextResponse.json({ error: "處理文件上傳失敗" }, { status: 500 });
  }
}

// 獲取文件類型的輔助函數
function getFileType(mimeType: string): string {
  const typeMap: { [key: string]: string } = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/msword": "doc",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/json": "json",
  };

  return typeMap[mimeType] || "file";
}
