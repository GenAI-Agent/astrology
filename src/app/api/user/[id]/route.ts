import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/prisma-multi";

// 获取单个用户
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const user = await DatabaseService.getUserById(userId);

    if (!user) {
      return NextResponse.json({
        code: 404,
        msg: "User not found",
        data: null,
      });
    }

    return NextResponse.json({
      code: 200,
      msg: "OK",
      data: user,
    });
  } catch (error) {
    console.error("获取用户失败:", error);
    return NextResponse.json({
      code: 500,
      msg: "Failed to get user",
      data: null,
    });
  }
}

// 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();

    // 检查用户是否存在
    const existingUser = await DatabaseService.getUserById(userId);

    if (!existingUser) {
      return NextResponse.json({
        code: 404,
        msg: "User not found",
        data: null,
      });
    }

    // 如果更新邮箱，检查邮箱是否已被其他用户使用
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await DatabaseService.getUserByEmail(body.email);

      if (emailExists) {
        return NextResponse.json({
          code: 409,
          msg: "Email already exists",
          data: null,
        });
      }
    }

    // 更新用户信息
    const updatedUser = await DatabaseService.updateUser(userId, {
      name: body.name !== undefined ? body.name : undefined,
      email: body.email !== undefined ? body.email : undefined,
      image: body.image !== undefined ? body.image : undefined,
      coverImage: body.coverImage !== undefined ? body.coverImage : undefined,
      bio: body.bio !== undefined ? body.bio : undefined,
      location: body.location !== undefined ? body.location : undefined,
      website: body.website !== undefined ? body.website : undefined,
      address: body.address !== undefined ? body.address : undefined,
    });

    return NextResponse.json({
      code: 200,
      msg: "OK",
      data: updatedUser,
    });
  } catch (error) {
    console.error("更新用户失败:", error);
    return NextResponse.json({
      code: 500,
      msg: "Failed to update user",
      data: null,
    });
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // 检查用户是否存在
    const existingUser = await DatabaseService.getUserById(userId);

    if (!existingUser) {
      return NextResponse.json({
        code: 404,
        msg: "User not found",
        data: null,
      });
    }

    // 删除用户
    await DatabaseService.deleteUser(userId);

    return NextResponse.json({
      code: 200,
      msg: "OK",
      data: null,
    });
  } catch (error) {
    console.error("删除用户失败:", error);
    return NextResponse.json({
      code: 500,
      msg: "Failed to delete user",
      data: null,
    });
  }
}
