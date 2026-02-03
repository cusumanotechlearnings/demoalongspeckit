/**
 * NextAuth config for Synthesis: session, sign-in/sign-up, user id on requests.
 * Use getServerSession() in Route Handlers to associate resources/assignments to user.
 * Login requires correct password; new users get a hashed password stored on first sign-up.
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { queryOne } from "@/lib/db";

const SALT_ROUNDS = 10;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await queryOne<{ id: string; email: string | null; name: string | null; password_hash: string | null }>(
          "SELECT id, email, name, password_hash FROM users WHERE LOWER(email) = $1",
          [email]
        );

        if (user) {
          // Existing user: require password
          if (!user.password_hash) return null; // must use Forgot password to set one
          const ok = await bcrypt.compare(password, user.password_hash);
          if (!ok) return null;
          return { id: user.id, email: user.email ?? user.id, name: user.name ?? email.split("@")[0] };
        }

        // New user: create account with hashed password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const id = email;
        const name = email.split("@")[0];
        const inserted = await queryOne<{ id: string }>(
          "INSERT INTO users (id, email, name, password_hash, updated_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (id) DO NOTHING RETURNING id",
          [id, email, name, passwordHash]
        );
        if (!inserted) return null; // conflict (e.g. race); user should sign in with password
        return { id, email, name };
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
