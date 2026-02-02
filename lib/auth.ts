/**
 * NextAuth config for Synthesis: session, sign-in/sign-up, user id on requests.
 * Use getServerSession() in Route Handlers to associate resources/assignments to user.
 *
 * Why this file: Keeps auth options in one place; route handlers only call
 * getServerSession() and check for null (unauthenticated).
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // MVP: accept any email/password and create a session with that email as id.
        // Replace with real DB lookup (e.g. users table by email) and password hash check.
        const email = credentials?.email?.trim();
        const password = credentials?.password;
        if (!email || !password) return null;
        // For demo we accept any non-empty; in production verify against users table.
        return { id: email, email, name: email.split("@")[0] };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
