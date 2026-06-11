import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth-crypto";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Mint Sign In",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "your_username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const inputUsername = credentials.username.trim().toLowerCase();

        // 1. Try checking the database users table first
        try {
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.username, inputUsername))
            .limit(1);

          if (
            dbUser &&
            verifyPassword(credentials.password, dbUser.passwordHash)
          ) {
            return {
              id: dbUser.id,
              name: dbUser.username,
            };
          }
        } catch (error) {
          console.error("Database authorization error:", error);
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    "some-very-secret-string-for-mint-development",
});

export { handler as GET, handler as POST };
