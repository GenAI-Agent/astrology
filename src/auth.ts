import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { projectPrisma } from "@/lib/project-prisma";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { encode as defaultEncode } from "next-auth/jwt";
import { v4 as uuid } from "uuid";
const adapter = PrismaAdapter(prisma);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  debug: false,
  trustHost: true,
  redirectProxyUrl:
    process.env.NODE_ENV === "production"
      ? process.env.AUTH_REDIRECT_PROXY_URL
      : undefined,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // 调用登录API
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_PRODUCTION_URL}/api/user/login`,
            {
              method: "POST",
              body: JSON.stringify({
                email: credentials?.email,
                password: credentials?.password,
              }),
            }
          );

          if (response.ok) {
            // 登录成功
            const data = await response.json();
            const userData = data.data;
            return userData;
          } else {
            return null;
          }
        } catch (error) {
          return null;
          //   throw new Error("登入失敗，請檢查帳號密碼");
        }
      },
    }),

    Google({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  basePath: "/api/auth",
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    signIn: async ({ user, account }) => {
      let prefix = "";
      if (account?.provider === "google") {
        prefix = "GL_";
      } else if (account?.provider === "line") {
        prefix = "LN_";
      } else if (account?.provider === "facebook") {
        prefix = "FB_";
      }

      if (user) {
        // 清除該用戶的所有現有 session，實現單一設備登入
        try {
          await prisma.session.deleteMany({
            where: {
              userId: user.id,
            },
          });
        } catch (error) {
          console.error("清除舊 session 時發生錯誤:", error);
        }

        // 檢查並建立 astro_user 資料
        try {
          const existingAstroUser = await projectPrisma.astroUser.findUnique({
            where: {
              id: user.id,
            },
          });

          if (!existingAstroUser) {
            // 為新用戶建立預設的占星資料
            await projectPrisma.astroUser.create({
              data: {
                id: user.id as string,
                birthLocation: "",
                birthDate: new Date(),
              },
            });
            console.log(`Created new astro_user record for user ${user.id}`);
          }
        } catch (error) {
          console.error("建立 astro_user 資料時發生錯誤:", error);
        }

        return true;
      } else {
        return false;
      }
    },
    async jwt({ token, account }) {
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      return token;
    },
    async session({ session, token }) {
      // session {
      //   sessionToken: 'f607f774-c5b9-49c3-babe-6d6f580f57b6',
      //   userId: 'cma8q2cq50000atkba9nupkeh',
      //   expires: 2025-06-02T21:15:42.866Z,
      //   createdAt: 2025-05-03T21:15:42.867Z,
      //   updatedAt: 2025-05-03T21:15:42.867Z,
      //   user: {
      //     id: 'cma8q2cq50000atkba9nupkeh',
      //     name: 'Fluxmind',
      //     email: 'x7048747@gmail.com',
      //     emailVerified: null,
      //     image: 'https://lh3.googleusercontent.com/a/ACg8ocKysSlKf0sZejq4AOIUaToOIKnuR-FvTRhm1-Yk6eesGFN48rg=s96-c',
      //     createdAt: 2025-05-03T21:15:42.700Z,
      //     updatedAt: 2025-05-03T21:15:42.700Z,
      //     bio: null,
      //     coverImage: null,
      //     location: null,
      //     website: null,
      //     address: null,
      //     motto: null
      //   }
      // }
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: {
            id: session.user.id,
          },
        });
        if (dbUser) {
          session.user = dbUser;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return url;
    },
  },
  jwt: {
    encode: async function (params) {
      if (params.token?.credentials) {
        const sessionToken = uuid();

        if (!params.token.sub) {
          throw new Error("No user ID found in token");
        }
        // console.log("!!params.token.sub", params.token.sub);
        const createdSession = await adapter?.createSession?.({
          sessionToken: sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        if (!createdSession) {
          throw new Error("Failed to create session");
        }

        return sessionToken;
      }
      return defaultEncode(params);
    },
  },
});
