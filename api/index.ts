import createApp from '../server/src/app';

// Initialize the Express app singleton for Vercel Serverless execution
const app = createApp();

export default app;
