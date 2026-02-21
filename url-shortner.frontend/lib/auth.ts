import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const backendUrl =
  process.env["services__url-shortener-backend__http__0"] ??
  "http://localhost:5112";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, exchange the Google ID token for a backend JWT
      if (account?.id_token) {
        try {
          const res = await fetch(`${backendUrl}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: account.id_token }),
          });
          if (res.ok) {
            const data = await res.json();
            token.backendToken = data.token;
          }
        } catch (err) {
          console.error("Failed to exchange Google token with backend:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken;
      return session;
    },
  },
};
