const socketIO = require('socket.io');

let io;

module.exports = {
  init: (server) => {
    io = socketIO(server, {
      cors: {
        origin: process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000'
          : [process.env.FRONTEND_URL, 'https://' + process.env.FRONTEND_URL],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    io.on('connection', (socket) => {
      console.log('Client connected', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
      });
    });
    
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
}; 