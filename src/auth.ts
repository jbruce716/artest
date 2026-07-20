import NextAuth from "next-auth";
import Authentik from "next-auth/providers/authentik";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Authentik({
      clientId: process.env.AUTHENTIK_CLIENT_ID!,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET || "",
      issuer: process.env.AUTHENTIK_ISSUER!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          username: profile.preferred_username,
          groups: profile.groups || [],
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = profile.sub as string;
        token.username = (profile as any).preferred_username;
        token.groups = (profile as any).groups || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).username = token.username;
        (session.user as any).groups = token.groups;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});