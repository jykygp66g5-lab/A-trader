export const API_URL =
  process.env.NEXT_PUBLIC_API_URL
  ?? "http://127.0.0.1:8000";


export function getToken() {
  if (
    typeof window
    === "undefined"
  ) {
    return null;
  }

  return localStorage.getItem(
    "token",
  );
}


export function saveToken(
  token: string,
) {
  if (
    typeof window
    === "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    "token",
    token,
  );

  document.cookie =
    `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}


export function removeToken() {
  if (
    typeof window
    === "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    "token",
  );

  document.cookie =
    "access_token=; path=/; max-age=0; samesite=lax";
}


export async function api(
  endpoint: string,
  options: RequestInit = {},
) {
  const token =
    getToken();

  const headers =
    new Headers(
      options.headers,
    );


  if (
    !headers.has(
      "Content-Type",
    )
    && options.body
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }


  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }


  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      },
    );


  if (
    response.status
    === 401
  ) {
    removeToken();

    if (
      typeof window
      !== "undefined"
    ) {
      window.location.replace(
        "/login",
      );
    }
  }


  return response;
}