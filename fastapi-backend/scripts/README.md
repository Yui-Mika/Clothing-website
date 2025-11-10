# Database Migration Scripts

This directory contains database migration scripts for the Clothing Website project.

## Available Migrations

### 1. Discount Fields Migration (`migrate_discount_fields.py`)

**Purpose:** Add discount management fields to all products in the database.

**What it does:**
- Adds `hasDiscount` (boolean) field to all products
- Adds `discountPercent` (float) field to all products
- Detects manual discounts (where `offerPrice < price`)
- Calculates `discountPercent` for products with existing manual discounts
- Sets default values (`hasDiscount=False`, `discountPercent=0`) for products without discounts

---

## Usage

### Run Migration

From the project root directory (`fastapi-backend/`):

```bash
# Activate virtual environment (if using one)
# On Windows:
venv\Scripts\activate

# On Linux/Mac:
source venv/bin/activate

# Run migration
python scripts/migrate_discount_fields.py
```

### Rollback Migration

If you need to undo the migration and remove discount fields:

```bash
python scripts/migrate_discount_fields.py --rollback
```

---

## Migration Output Example

```
================================================================================
DISCOUNT FIELDS MIGRATION SCRIPT
================================================================================

📡 Connecting to MongoDB...
✅ Connected! Found 35 products in database

📊 Products without discount fields: 25

⚠️  This will update 25 products
Continue? (yes/no): yes

🚀 Starting migration...

✓ [673b1234567890abcdef1011] Premium Leather Men's Wallet
  Manual discount detected: 11.33%
  Price: 450,000 → Offer: 399,000

✓ [673b1234567890abcdef1016] Rugger Long Sleeve Polo Shirt
  Set default values (no discount)

================================================================================
MIGRATION SUMMARY
================================================================================
✅ Total updated: 25
🔍 Products with manual discount: 8
📝 Products without discount: 17
❌ Errors: 0

🎉 Migration completed successfully!

🔍 Verifying migration...
✅ Verification passed! All products now have discount fields

👋 Database connection closed
```

---

## Before Running Migration

1. **Backup your database** (recommended)
   ```bash
   mongodump --db clothing_website --out ./backup
   ```

2. **Check MongoDB connection**
   - Ensure MongoDB is running
   - Verify connection string in `.env` file
   - Test connection: `python -c "from app.config.database import db; print('OK')"`

3. **Review products**
   - Check how many products will be affected
   - Understand which products have manual discounts

---

## After Running Migration

1. **Verify in MongoDB Compass/Shell**
   ```javascript
   // Check products with discount
   db.products.find({ hasDiscount: true }).count()
   
   // Check products without discount
   db.products.find({ hasDiscount: false }).count()
   
   // View sample product with discount
   db.products.findOne({ hasDiscount: true })
   ```

2. **Test Admin Panel**
   - Log in to admin panel
   - Navigate to Products → List
   - Try applying/removing discounts
   - Verify discount UI shows correctly

3. **Test Frontend**
   - Visit product pages
   - Check discount badges display
   - Verify price calculations
   - Test filtering by discounted products

---

## Troubleshooting

### Error: `ModuleNotFoundError: No module named 'motor'`
```bash
pip install motor pymongo
```

### Error: `Could not connect to MongoDB`
- Check if MongoDB service is running
- Verify MONGODB_URL in `.env` file
- Check network/firewall settings

### Error: `Database access denied`
- Verify MongoDB user permissions
- Check authentication credentials in `.env`

### Products still missing discount fields after migration
- Re-run the migration script
- Check for errors in the output
- Manually inspect problematic products in MongoDB

---

## Best Practices

1. **Always backup before migration** - Use `mongodump` to backup your database
2. **Run in development first** - Test migration on dev database before production
3. **Read the output carefully** - Check for errors and warnings
4. **Verify after migration** - Use MongoDB Compass to inspect results
5. **Test thoroughly** - Test all discount features after migration

---

## Additional Notes

- Migration is **idempotent** - safe to run multiple times
- Existing discount fields will NOT be overwritten
- Migration adds `updatedAt` timestamp to modified products
- Manual discounts are **preserved** and converted to the new system

---

## Support

If you encounter issues:
1. Check the console output for error messages
2. Review MongoDB logs
3. Verify database connection settings
4. Ensure all dependencies are installed
5. Contact the development team for assistance

---

## Migration History

| Date | Script | Description | Status |
|------|--------|-------------|--------|
| 2024-11-08 | `migrate_discount_fields.py` | Initial discount fields migration | ✅ Ready |

---

**Note:** Keep this README updated when adding new migration scripts!
