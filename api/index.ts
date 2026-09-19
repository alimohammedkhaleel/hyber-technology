import createApp from '../server/src/app';

// Initialize the Express app singleton for Vercel Serverless execution
const app = createApp();

function handler(req: any, res: any) {
  return app(req, res);
}

(handler as any).default = handler;
(handler as any).app = app;

module.exports = handler;
export default handler;


