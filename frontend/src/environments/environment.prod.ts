export const environment = {
  production: true,
  // Protocol and host might be left empty for same-origin requests
  // apiUrl: "http://192.168.1.16:3000/", //"http://localhost:3000", //"/api",
  // apiUrl: "http://localhost:3000",
  // apiUrl: "/api",
  apiUrl: "https://devchat.serwerigora.com/api",
  capacitorApiUrl: "https://devchat.serwerigora.com/api",
  // do not forget to update the hostname capacitor.config.ts. Change it to THE SAME master domain
  // and a DIFFERENT SUBdomain. That's a workaround to make cookies look "1st-party" so they work on Android
  socketIoUrl: "https://devchat.serwerigora.com/api",
  capacitorSocketIoUrl: "https://devchat.serwerigora.com",
  // socketIoUrl: "http://192.168.1.16:3000", //"http://localhost:3000",// "",
  // socketIoUrl: "http://localhost:3000",
  socketIoPath: "/socket.io",
  vapidPublicKey: "BMyiXPt22cjNGJqKGb_KdJCklow0_ig7C-qbNKXBLu48eycO9cf8mFDrzqTk95pdzE-Fnr-uzB1cUIZQwu95enU"
};
