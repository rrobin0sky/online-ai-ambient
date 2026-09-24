export default {
  async fetch(request: Request, env: any): Promise<Response> {
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Ambient4K Web Not Found', { status: 404 });
  },
};
