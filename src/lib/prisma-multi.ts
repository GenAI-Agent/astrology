import { PrismaClient } from "@prisma/client";
import { PrismaClient as ProjectPrismaClient } from "../generated/project-client";

// 用戶認證數據庫客戶端 (專門用於 NextAuth)
const globalForUserPrisma = globalThis as unknown as {
  userPrisma: PrismaClient;
};

export const userPrisma =
  globalForUserPrisma.userPrisma ||
  (process.env.USER_DATABASE_URL
    ? new PrismaClient({ datasourceUrl: process.env.USER_DATABASE_URL })
    : new PrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForUserPrisma.userPrisma = userPrisma;
}

// 專案業務數據庫客戶端
const globalForProjectPrisma = globalThis as unknown as {
  projectPrisma: ProjectPrismaClient;
};

export const projectPrisma =
  globalForProjectPrisma.projectPrisma ||
  (process.env.PROJECT_DATABASE_URL
    ? new ProjectPrismaClient({
        datasourceUrl: process.env.PROJECT_DATABASE_URL,
      })
    : new ProjectPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForProjectPrisma.projectPrisma = projectPrisma;
}

// 為了向後兼容，預設導出用戶數據庫客戶端
export const prisma = userPrisma;

// 資料庫服務類別
export class DatabaseService {
  // === 用戶相關操作 (使用 userPrisma) ===
  static async getUserById(id: string) {
    return await userPrisma.user.findUnique({
      where: { id },
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
  }

  static async getUserByEmail(email: string) {
    return await userPrisma.user.findUnique({
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
  }

  static async createUser(data: {
    name?: string;
    email: string;
    image?: string;
    coverImage?: string;
    bio?: string;
    location?: string;
    website?: string;
    address?: string;
  }) {
    return await userPrisma.user.create({
      data,
    });
  }

  static async updateUser(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      image: string;
      coverImage: string;
      bio: string;
      location: string;
      website: string;
      address: string;
    }>
  ) {
    return await userPrisma.user.update({
      where: { id },
      data,
    });
  }

  static async deleteUser(id: string) {
    return await userPrisma.user.delete({
      where: { id },
    });
  }

  static async getUsers() {
    return await userPrisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }
  static async getUserSubscriptions(userId: string, lensViewId: string) {
    return await userPrisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptions: {
          where: {
            lensViewId: lensViewId,
          },
          include: {
            plan: true,
          },
        },
      },
    });
  }
}

export class ProjectDatabaseService {}
