import express from "express"
import { allOrders, placeOrderCOD, placeOrderStripe, updateStatus, userOrders } from "../controllers/orderController.js"
import authAdmin from "../middleware/authAdmin.js"
import authUser from "../middleware/authUser.js"

const orderRouter = express.Router()

// For Admin 
orderRouter.post('/list', authAdmin, allOrders)
orderRouter.post('/status', authAdmin, updateStatus)
// For Payment
orderRouter.post('/cod', authUser, placeOrderCOD)
orderRouter.post('/stripe', authUser, placeOrderStripe)
// For User
orderRouter.post('/userorders', authUser, userOrders)

export default orderRouter