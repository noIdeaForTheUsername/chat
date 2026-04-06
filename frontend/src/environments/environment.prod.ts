export const environment = {
  production: true,
  // Protocol and host might be left empty for same-origin requests
  
  // apiUrl: "/api",
  // socketIoUrl: "",
  // capacitorApiUrl: "https://chat.serwerigora.com/api",
  // capacitorSocketIoUrl: "https://chat.serwerigora.com",

  apiUrl: "http://192.168.1.16:3000",
  socketIoUrl: "http://192.168.1.16:3000",
  capacitorApiUrl: "http://192.168.1.16:3000",
  capacitorSocketIoUrl: "http://192.168.1.16:3000",

  // apiUrl: "http://localhost:3000",
  // socketIoUrl: "http://localhost:3000",
  // capacitorApiUrl: "http://localhost:3000",
  // capacitorSocketIoUrl: "http://localhost:3000",

  // do not forget to update the hostname capacitor.config.ts. Change it to THE SAME master domain
  // and a DIFFERENT SUBdomain. That's a workaround to make cookies look "1st-party" so they work on Android
  socketIoPath: "/socket.io",
  vapidPublicKey: "BMyiXPt22cjNGJqKGb_KdJCklow0_ig7C-qbNKXBLu48eycO9cf8mFDrzqTk95pdzE-Fnr-uzB1cUIZQwu95enU"
};
