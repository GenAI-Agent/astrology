import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "缺少key参数" }, { status: 400 });
  }

  try {
    // 初始化S3客户端
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "ap-northeast-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    // 设置获取对象的参数
    const params = {
      Bucket: process.env.S3_BUCKET_NAME || "",
      Key: key,
    };

    // 发送请求获取S3对象
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);

    // 处理响应
    if (response.Body) {
      // 检查文件类型
      const isAudioFile =
        key.toLowerCase().endsWith(".wav") ||
        key.toLowerCase().endsWith(".mp3") ||
        key.toLowerCase().endsWith(".ogg");

      if (isAudioFile) {
        // 对于音频文件，直接返回二进制数据
        const audioBuffer = await response.Body.transformToByteArray();

        // 设置适当的 Content-Type
        let contentType = "audio/wav";
        if (key.toLowerCase().endsWith(".mp3")) {
          contentType = "audio/mpeg";
        } else if (key.toLowerCase().endsWith(".ogg")) {
          contentType = "audio/ogg";
        }

        return new NextResponse(audioBuffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Length": audioBuffer.length.toString(),
            "Cache-Control": "public, max-age=31536000", // 缓存1年
          },
        });
      } else {
        // 对于JSON文件，按原来的方式处理
        const str = await response.Body.transformToString();
        const data = JSON.parse(str);
        return NextResponse.json(data);
      }
    }

    return NextResponse.json({ error: "获取S3数据失败" }, { status: 500 });
  } catch (error) {
    console.error("S3访问错误:", error);
    return NextResponse.json({ error: "获取S3数据失败" }, { status: 500 });
  }
}
