export const environment = {
  production: true,
  apiUrl: '/api', // Same-origin: nginx in the frontend container proxies /api to the backend
  logLevel: 'error', // Log only errors
};
