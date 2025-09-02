SockerIo = (io) => {
  //Store connected users with their room information using socket.id as their key
  const connectedUsers = new Map();
  //handle new socket connections
  io.on("connection", (socket) => {
    //get user from authentication
    const user = socket.handshake.auth.user;
    console.log("user connected", user?.username);
    //start:join room handler
    socket.on("join room", (groupId) => {
      //add socket to specified room
      socket.join(groupId);
      //store user and room info in connectedUsers map
      connectedUsers.set(socket.id, { user, room: groupId });
      //get list of all users
      const usersInRoom = Array.from(connectedUsers.values())
        .filter((u) => u.room === groupId)
        .map((u) => u.user);
      //emit updated uers list to all client in room
      io.in(groupId).emit("users in room ", usersInRoom);
      // Broadcast join notification to all other users in the room
      socket.to(groupId).emit("notification", {
        type: "USER_JOINED",
        notification: `&{user?.username} has joined`,
        user: user,
      });
    });
    //end :join room  handler

    //star:leave group
    //Triggered when user manually leaves a room
    socket.on("leave room", (groupId) => {
      console.log(`${user?.username} leaving room:`, groupId);
      //Remove socket from the room
      socket.leave(groupId);
      if (connectedUsers.has(socket.id)) {
        //Remove user from connected users and notify others
        connectedUsers.delete(socket.id);
        socket.to(groupId).emit("user left", user?._id);
      }
    });
    //end:leave group

    //new message handler
    //Triggered when user sends a new message
    socket.on("new message", (message) => {
      // Broadcast message to all other users in the room
      socket.to(message.groupId).emit("message received", message);
    });
    //!END:New Message Handler
    //disconnect handler
    //Triggered when user closes the connection
    socket.on("disconnect", () => {
      console.log(`${user?.username} disconnected`);
      if (connectedUsers.has(socket.id)) {
        // Get user's room info before removing
        const userData = connectedUsers.get(socket.id);
        //Notify others in the room about user's departure
        socket.to(userData.room).emit("user left", user?._id);
        //Remove user from connected users
        connectedUsers.delete(socket.id);
      }
    });
    //!END:Disconnect Handler
    // typing indicator
    //Triggered when user starts typing
    socket.on("typing", ({ groupId, username }) => {
      //Broadcast typing status to other users in the room
      socket.to(groupId).emit("user typing", { username });
    });

    socket.on("stop typing", ({ groupId }) => {
      //Broadcast stop typing status to other users in the room
      socket.to(groupId).emit("user stop typing", { username: user?.username });
    });
    //!END:Typing Indicator
  });
};
module.exports = SockerIo;
