const GOOGLE_SCOPES = ["openid", "email", "profile"].join(" ");

export function getGitHubOAuthRedirectUri() {
  return `${window.location.origin}/auth/callback`;
}

export function getGoogleOAuthRedirectUri() {
  return `${window.location.origin}/auth/google/callback`;
}

/** Original GitHub OAuth — authorize at /auth/callback */
export function startGitHubOAuth() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "";
  if (!clientId) {
    alert("GitHub sign-in is not configured. Add VITE_GITHUB_CLIENT_ID to your frontend .env file.");
    return;
  }

  const redirectUri = getGitHubOAuthRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user,user:email",
  });

  window.location.href = `https://github.com/login/oauth/authorize?${params}`;
}

export function startGoogleOAuth() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  if (!clientId) {
    alert("Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to your frontend .env file.");
    return;
  }

  const redirectUri = getGoogleOAuthRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "online",
    prompt: "select_account",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
