import createApp from '../src/app';

const app = createApp();

function handler(req: any, res: any) {
  return app(req, res);
}

// Attach default and app references for maximum loader compatibility
(handler as any).default = handler;
(handler as any).app = app;

module.exports = handler;
export default handler;



