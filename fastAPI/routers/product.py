from typing import List
from fastapi import APIRouter, Depends, File, Form, UploadFile
from app.db.mongo import db
from app.schemas.product import ProductCreate
from app.dependencies.auth import require_admin
from app.utils.cloudinary import setup_cloudinary, upload_image
from app.utils.serialization import normalize_doc


router = APIRouter()


@router.post("/add")
async def add_product(
    productData: str = Form(...),
    images: List[UploadFile] = File(default=[]),
    _: None = Depends(require_admin),
):
    setup_cloudinary()
    data = ProductCreate.model_validate_json(productData).model_dump()
    urls: List[str] = []
    for img in images:
        # Save to temp file to upload
        content = await img.read()
        import tempfile

        with tempfile.NamedTemporaryFile(delete=True) as tmp:
            tmp.write(content)
            tmp.flush()
            url = upload_image(tmp.name)
            urls.append(url)
    data["image"] = urls
    await db.products.insert_one(data)
    return {"success": True, "message": "Product Added"}


@router.get("/list")
async def list_product():
    cursor = db.products.find({})
    products = [normalize_doc(doc) async for doc in cursor]
    return {"success": True, "products": products}


@router.post("/single")
async def single_product(payload: dict):
    product_id = payload.get("productId")
    from bson import ObjectId

    doc = await db.products.find_one({"_id": ObjectId(product_id)})
    return {"success": True, "product": normalize_doc(doc)}


@router.post("/stock")
async def change_stock(payload: dict):
    product_id = payload.get("productId")
    in_stock = payload.get("inStock")
    from bson import ObjectId

    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": {"inStock": in_stock}})
    return {"success": True, "message": "Stock Updated"}


