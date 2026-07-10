// Fluxo OAuth2 do Google implementado à mão (sem passport, que é Express-only).
// Substitui a GoogleStrategy do backend antigo.

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export function getGoogleClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID não configurada");
  return id;
}

function getGoogleClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET não configurada");
  return secret;
}

/**
 * A callback precisa ser IDÊNTICA a uma URI registrada no Google Cloud Console.
 * Derivamos do próprio domínio da requisição para funcionar em preview e prod,
 * mas cada domínio usado precisa estar registrado no console.
 */
export function buildRedirectUri(origin: string): string {
  return `${origin}/api/users/auth/google/callback`;
}

export function buildGoogleAuthUrl({
  origin,
  state,
}: {
  origin: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: buildRedirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GoogleProfile {
  email: string;
  name: string;
}

export async function exchangeCodeForProfile({
  code,
  origin,
}: {
  code: string;
  origin: string;
}): Promise<GoogleProfile> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: buildRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error("Falha ao trocar código OAuth por token");
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userRes.ok) {
    throw new Error("Falha ao buscar perfil do Google");
  }

  const profile = (await userRes.json()) as {
    email?: string;
    name?: string;
  };

  if (!profile.email) {
    throw new Error("Perfil do Google sem email");
  }

  return { email: profile.email, name: profile.name ?? profile.email };
}
