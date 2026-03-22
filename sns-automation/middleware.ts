export const config = {
  matcher: '/(.*)',
};

export default function middleware(request: Request) {
  const basicAuth = request.headers.get('authorization');
  const url = new URL(request.url);

  // 認証が不要なパス（Cronジョブなど）
  if (url.pathname.startsWith('/api/cron')) {
    return new Response(null, {
      headers: { 'x-middleware-next': '1' }
    });
  }

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    const validUser = process.env.BASIC_AUTH_USER || 'admin';
    const validPwd = process.env.BASIC_AUTH_PASSWORD || '0000';

    if (user === validUser && pwd === validPwd) {
      // 次の処理へ進む
      return new Response(null, {
        headers: { 'x-middleware-next': '1' }
      });
    }
  }

  return new Response('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
