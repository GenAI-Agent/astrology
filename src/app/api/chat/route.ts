import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("Lens");
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    // 創建基礎查詢條件
    const query: any = {};
    if (userId) query.userId = userId;
    if (sessionId) query.sessionId = sessionId;

    // 執行查詢
    let chatHistory;
    if (sessionId && userId) {
      chatHistory = await db.collection("User_History_Astro").findOne(query);
    } else {
      chatHistory = await db
        .collection("User_History_Astro")
        .find(query)
        .toArray();
    }

    return NextResponse.json({
      code: 200,
      msg: "OK",
      data: chatHistory,
    });
  } catch (error) {
    return NextResponse.json({
      code: 500,
      msg: "獲取聊天記錄失敗" + error,
      data: null,
    });
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("Lens");
    const body = await request.json();

    // 检查必要参数
    if (!body.userId || !body.sessionId) {
      return NextResponse.json({
        code: 400,
        msg: "缺少必要參數userId或sessionId",
        data: null,
      });
    }

    // 准备要保存的数据
    const chatData = {
      userId: body.userId,
      sessionId: body.sessionId,
      messages: body.messages || [],
      title: body.title || "新會話",
      createdAt: body.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // 查询条件
    const query = {
      userId: body.userId,
      sessionId: body.sessionId,
    };

    // 更新或插入数据
    const result = await db
      .collection("User_History_Astro")
      .updateOne(query, { $set: chatData }, { upsert: true });

    return NextResponse.json({
      code: 200,
      msg:
        result.upsertedCount > 0 ? "聊天記錄已成功創建" : "聊天記錄已成功更新",
      data: chatData,
    });
  } catch (error) {
    return NextResponse.json({
      code: 500,
      msg: "保存聊天記錄失敗" + error,
      data: null,
    });
  }
}

export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("Lens");
    const body = await request.json();

    // 检查必要参数
    if (!body.userId || !body.sessionId || !body.title) {
      return NextResponse.json({
        code: 400,
        msg: "缺少必要參數userId、sessionId或title",
        data: null,
      });
    }

    // 查询条件
    const query = {
      userId: body.userId,
      sessionId: body.sessionId,
    };

    // 更新标题
    const result = await db
      .collection("User_History_Astro")
      .updateOne(query, { $set: { title: body.title, updatedAt: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json({
        code: 404,
        msg: "未找到符合條件的聊天記錄",
        data: null,
      });
    }

    return NextResponse.json({
      code: 200,
      msg: "聊天記錄標題已成功更新",
      data: { title: body.title },
    });
  } catch (error) {
    return NextResponse.json({
      code: 500,
      msg: "更新聊天記錄標題失敗" + error,
      data: null,
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("Lens");
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({
        code: 400,
        msg: "缺少必要參數sessionId",
        data: null,
      });
    }

    const query = {
      sessionId: sessionId,
      userId: userId,
    };

    const result = await db.collection("User_History_Astro").deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({
        code: 404,
        msg: "未找到符合條件的聊天記錄",
        data: null,
      });
    }

    return NextResponse.json({
      code: 200,
      msg: "聊天記錄已成功刪除",
      data: null,
    });
  } catch (error) {
    return NextResponse.json({
      code: 500,
      msg: "刪除聊天記錄失敗" + error,
      data: null,
    });
  }
}
