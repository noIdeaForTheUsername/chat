// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // apiUrl: "https://devchat.serwerigora.com/api",
  // socketIoUrl: "https://devchat.serwerigora.com",
  // capacitorApiUrl: "https://devchat.serwerigora.com/api",
  // capacitorSocketIoUrl: "https://devchat.serwerigora.com",

  // Dev configuration
  apiUrl: "http://192.168.1.16:3000",
  socketIoUrl: "http://192.168.1.16:3000",
  capacitorApiUrl: "http://192.168.1.16:3000",
  capacitorSocketIoUrl: "http://192.168.1.16:3000",

  // Production configuration
  // apiUrl: "/api",
  // capacitorApiUrl: "https://chat.serwerigora.com/api",
  // socketIoUrl: "",
  // capacitorSocketIoUrl: "https://chat.serwerigora.com",
  
  socketIoPath: "/socket.io",

  vapidPublicKey: "BMyiXPt22cjNGJqKGb_KdJCklow0_ig7C-qbNKXBLu48eycO9cf8mFDrzqTk95pdzE-Fnr-uzB1cUIZQwu95enU"
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
