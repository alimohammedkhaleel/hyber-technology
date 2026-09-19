import createApp from '../server/src/app';

// Initialize the Express app singleton for Vercel Serverless execution
const app = createApp();

(app as any).default = app;
module.exports = app;
export default app;

