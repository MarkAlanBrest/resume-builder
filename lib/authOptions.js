import AzureADProvider from "next-auth/providers/azure-ad";
import { isEmailAllowed } from "./adminAuth";

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "common",
    }),
  ],
  pages: {
    signIn: "/admin",
    error: "/admin",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      return isEmailAllowed(user.email);
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function isMicrosoftAuthConfigured() {
  return !!(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.NEXTAUTH_SECRET
  );
}
