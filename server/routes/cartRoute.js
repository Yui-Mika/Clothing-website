import express from "express"
import { addToCart, updateCart } from "../controllers/cartController.js"
import authUser from "../middleware/authUser.js"

const cartRouter = express.Router()

cartRouter.post('/add', authUser, addToCart)
cartRouter.post('/update', authUser, updateCart)

export default cartRouter