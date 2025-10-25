import express from "express"
import { upload} from "../middleware/multer.js"
import { addProduct, changeStock, listProduct, singleProduct } from "../controllers/productController.js"
import authAdmin from "../middleware/authAdmin.js";

const porductRouter = express.Router()

porductRouter.post('/add', upload.array(["images"]), authAdmin, addProduct);
porductRouter.get('/list', listProduct);
porductRouter.post('/single', singleProduct);
porductRouter.post('/stock', changeStock);


export default porductRouter