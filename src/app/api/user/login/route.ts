import { NextRequest, NextResponse } from "next/server";
import { userPrisma } from "@/lib/prisma-multi";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    // 验证请求数据
    if (!email || !password) {
      return NextResponse.json({
        code: 400,
        msg: "Email and password are required",
        data: null,
      });
    }

    // 查找用户
    const user = await userPrisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    // 检查用户是否存在
    if (!user) {
      return NextResponse.json({
        code: 404,
        msg: "User not found",
        data: null,
      });
    }

    // 目前使用固定密码"lens123"进行验证
    // 在实际生产环境中，应该使用更安全的密码存储和验证方式
    if (password !== "lens123") {
      return NextResponse.json({
        code: 401,
        msg: "Incorrect password",
        data: null,
      });
    }

    // 登录成功
    return NextResponse.json({
      code: 200,
      msg: "Login successful",
      data: user,
    });
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json({
      code: 500,
      msg: "Login failed",
      data: null,
    });
  }
}
