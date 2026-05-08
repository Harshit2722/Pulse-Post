require("dotenv").config();

const express = require('express');
const http = require('http');
const {Server} = require("socket.io");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3001;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const errorHandler = require('./middleware/errorMiddleware');
const User = require("./models/userModel");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require('./routes/postRoutes')

const httpServer = http.createServer(app);

const io = new Server(httpServer,{
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    }
  });

app.set("io",io)

io.on("connection", (socket)=>{
    console.log("Socket.io connected", socket.id);

    socket.on("disconnect", ()=>{
        console.log("Socket disconnected", socket.id);
    })
})

io.use(async(socket,next)=>{
    const token = socket.handshake.auth.token;

    if(!token) return next(new Error("Authentication Error"));

    try{
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedToken._id).select("-password");
        if(!user) return next(new Error("Authentication Error"));

        console.log("Token verified", user);
        socket.data.user = user;
        next();
    }catch(err){
        return next(new Error("Authentication Error"));
    }
})


app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true,
}));
app.use((req,res,next)=>{
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] | ${req.method} | ${req.url} | ${res.statusCode}`);
    next();
})

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts',postRoutes)

app.get('/', (req, res) => {
  res.send('Pulse-Post Backend is alive! 🚀');
});


app.use(errorHandler);


mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully!');

    // Drop the obsolete username index if it exists
    User.collection.dropIndex('username_1').catch(err => {
      if (err.codeName !== 'IndexNotFound') {
        console.error('Error dropping username index:', err);
      }
    });

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log("Socket.io ready for the Pulse! ")
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });




