import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  const USER_NAME = process.env.ADMIN_USER || 'admin';
  const USER_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === USER_NAME && pwd === USER_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area"',
    },
  });
}

export const config = {
  matcher: '/admin/:path*',
};