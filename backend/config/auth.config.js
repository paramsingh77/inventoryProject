module.exports = {
  secret: process.env.JWT_SECRET || "95f9181baec2b4971db281049e0889c57db006b966c9dee4292c855e16f1e07932a9c290a5456a85aea6997450299f5cf3469f09f990d5e82bf9f2913789181f",
  jwtExpiration: 86400,  // 24 hours
  jwtRefreshExpiration: 604800,  // 7 days
}; 