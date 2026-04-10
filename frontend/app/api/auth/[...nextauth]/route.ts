import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Fonction de connexion via le backend Express
 */
async function loginWithBackend(
  email: string,
  password: string
): Promise<{ success: boolean; accessToken?: string; refreshToken?: string; user?: any; message?: string }> {
  try {
    const backendUrl = process.env.API_URL || "http://localhost:4000/api";
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.message || "Erreur de connexion",
      };
    }

    return {
      success: true,
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      user: {
        id: data.data.user.id,
        email: data.data.user.email,
        firstName: data.data.user.firstName,
        lastName: data.data.user.lastName,
        name: `${data.data.user.firstName} ${data.data.user.lastName}` || data.data.user.email,
        role: data.data.user.role,
        permissions: data.data.user.permissions || [],
      },
    };
  } catch (error: any) {
    console.error("Backend login error:", error);
    return {
      success: false,
      message: "Impossible de joindre le serveur d'authentification",
    };
  }
}

/**
 * Configuration NextAuth
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@kama-delices.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        const result = await loginWithBackend(credentials.email, credentials.password);

        if (!result.success) {
          throw new Error(result.message || "Erreur de connexion");
        }

        return {
          id: result.user?.id || credentials.email,
          email: credentials.email,
          name: result.user?.name || credentials.email,
          firstName: result.user?.firstName,
          lastName: result.user?.lastName,
          role: result.user?.role,
          permissions: result.user?.permissions,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        } as any;
      },
    }),
  ],
  callbacks: {
    /**
     * Callback JWT : ajouter les informations utilisateur au token
     */
    async jwt({ token, user, account: _account }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    /**
     * Callback Session : ajouter les informations du token à la session
     */
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).firstName = token.firstName as string;
        (session.user as any).lastName = token.lastName as string;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
      }
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 jours (matche avec JWT_REFRESH_EXPIRES_IN)
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
