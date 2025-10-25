import express from "express"
import cors from "cors"
import 'dotenv/config'
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import porductRouter from "./routes/productRoute.js"
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import connectDB from "./config/mongodb.js"
import cookieParser from "cookie-parser"
import adminRouter from "./routes/adminRoute.js"
import { stripeWebhooks } from "./controllers/orderController.js"


const app = express()  // Initialize Express application
const port = process.env.PORT || 4000 // Define server port

await connectDB()  // Establish connection to the database
await connectCloudinary() // Set up Cloudinary for image storage

// Allow multiple origins
const allowedOrigins = ['http://localhost:5173']

app.post('/stripe', express.raw({type: 'application/json'}), stripeWebhooks)

// Middleware setup 
app.use(express.json()) // Enables JSON request body parsing
app.use(cookieParser()) // Cookie-parser middleware To parse HTTP request cookies
app.use(cors({ 
  origin: allowedOrigins,  // Whitelist of allowed domains
  credentials: true        // Required for cookies/authorization headers
}));

// Define API routes
app.use('/api/user', userRouter) // Routes for user-related operations
app.use('/api/admin', adminRouter) // Routes for admin-related operations  
app.use('/api/product', porductRouter) // Routes for product management
app.use('/api/cart', cartRouter) // Routes for cart functionality
app.use('/api/order', orderRouter) // Routes for handling orders

// Root endpoint to check API status
app.get('/',(req, res)=>{
    res.send("API successfully connected!")
})

// Start the server
app.listen(port, ()=> console.log('Server is running on PORT: '+ port))