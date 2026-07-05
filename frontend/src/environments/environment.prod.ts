export const environment = {
  production: true,

  // WHEN UPDATING DON'T FORGET:
  // - Protocol and host might (and should) be left empty for same-origin requests
  // - update the hostname capacitor.config.ts when changing the API URLs. Change it to THE SAME master domain
  // and a DIFFERENT SUBdomain. That's a workaround to make cookies look "1st-party" so they work on Android (shitty but nothing else worked)
  // - there's /api and /socket.io excluded from navigationUrls in ngsw-config.json, so if you change the API URLs,
  // make sure to update that file too so the service worker doesn't intercept those requests and break the app (for example, file downloads)

  // MAIN PRODUCTION CONFIGURATION
  apiUrl: "/api",
  socketIoUrl: "",
  capacitorApiUrl: "https://chat.serwerigora.com/api",
  capacitorSocketIoUrl: "https://chat.serwerigora.com",
  socketIoPath: "/socket.io",

  // TESTING CONFIGURATIONS (testing in production mode is sometimes needed):

  // Staging configuartion
  // apiUrl: "/api",
  // socketIoUrl: "",
  // capacitorApiUrl: "https://devchat.serwerigora.com/api",
  // capacitorSocketIoUrl: "https://devchat.serwerigora.com",
  // socketIoPath: "/socket.io",

  // Dev configuration 1
  // apiUrl: "http://192.168.1.16:3000",
  // socketIoUrl: "http://192.168.1.16:3000",
  // capacitorApiUrl: "http://192.168.1.16:3000",
  // capacitorSocketIoUrl: "http://192.168.1.16:3000",
  // socketIoPath: "/socket.io",

  // Dev configuration 2
  // apiUrl: "http://localhost:3000",
  // socketIoUrl: "http://localhost:3000",
  // capacitorApiUrl: "http://localhost:3000",
  // capacitorSocketIoUrl: "http://localhost:3000",
  // socketIoPath: "/socket.io",

  
  vapidPublicKey: "BMyiXPt22cjNGJqKGb_KdJCklow0_ig7C-qbNKXBLu48eycO9cf8mFDrzqTk95pdzE-Fnr-uzB1cUIZQwu95enU"
};
