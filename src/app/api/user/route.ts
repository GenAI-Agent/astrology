import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/prisma-multi";

// 获取所有用户
export async function GET(request: NextRequest) {
  try {
    const users = await DatabaseService.getUsers();

    return NextResponse.json({
      code: 200,
      msg: "OK",
      data: { data: users },
    });
  } catch (error) {
    console.error("获取用户失败:", error);
    return NextResponse.json({
      code: 500,
      msg: "获取用户失败",
      data: null,
    });
  }
}

// 创建新用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 检查必填字段
    if (!body.email) {
      return NextResponse.json({
        code: 400,
        msg: "Email is required",
        data: null,
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await DatabaseService.getUserByEmail(body.email);

    if (existingUser) {
      return NextResponse.json({
        code: 409,
        msg: "Email already exists",
        data: null,
      });
    }

    // 创建新用户
    const newUser = await DatabaseService.createUser({
      name: body.name,
      email: body.email,
      image: body.image,
      coverImage: body.coverImage,
      bio: body.bio,
      location: body.location,
      website: body.website,
      address: body.address,
    });

    return NextResponse.json({
      code: 201,
      msg: "User created successfully",
      data: { data: newUser },
    });
  } catch (error) {
    console.error("创建用户失败:", error);
    return NextResponse.json({
      code: 500,
      msg: "Failed to create user",
      data: null,
    });
  }
}
