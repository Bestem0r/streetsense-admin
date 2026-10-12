export const environment = {
  production: false,
  apiUrl: 'http://localhost:9091/api', // Local backend URL
  // ng serve does not host the captured images; read them from the server.
  imageBaseUrl: 'http://vc07.idi.ntnu.no/RoadPolesImages/2026',
  logLevel: 'debug', // Extra logs for debugging
};
