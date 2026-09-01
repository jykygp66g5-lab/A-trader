import {
  NextRequest,
  NextResponse,
} from "next/server";


export function proxy(
  request: NextRequest,
) {
  const token =
    request.cookies
      .get("access_token")
      ?.value;

  const pathname =
    request.nextUrl.pathname;


  if (!token) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname =
      "/login";

    loginUrl.searchParams.set(
      "from",
      pathname,
    );

    return NextResponse.redirect(
      loginUrl,
    );
  }


  return NextResponse.next();
}


export const config = {
  matcher: [
    "/dashboard/:path*",
    "/journal/:path*",
    "/analytics/:path*",
    "/ai-coach/:path*",
    "/market/:path*",
    "/replay/:path*",
  ],
};