import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function getUserId(request: NextRequest): Promise<string | null> {
  const token = await getToken({
    req: request,
    secret:
      process.env.NEXTAUTH_SECRET ||
      "some-very-secret-string-for-mint-development",
  });
  return token?.sub ?? null;
}
