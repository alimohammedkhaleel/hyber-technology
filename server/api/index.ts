import createApp from '../src/app';

const app = createApp();

// Attach default property to function for ES Module interop
(app as any).default = app;

// Direct CommonJS export for @vercel/node serverless invocation
module.exports = app;

// ES module export
export default app;


