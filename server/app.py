
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncpg
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_db():
    if not hasattr(app.state, "pool"):
        app.state.pool = await asyncpg.create_pool(os.environ.get("DATABASE_URL"))
    return app.state.pool

@app.get("/api/products")
async def get_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None
):
    pool = await get_db()
    async with pool.acquire() as conn:
        # Implement query logic here
        products = await conn.fetch("SELECT * FROM products LIMIT $1 OFFSET $2", limit, (page - 1) * limit)
        total = await conn.fetchval("SELECT COUNT(*) FROM products")
        
        return {
            "data": products,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": (total + limit - 1) // limit
            }
        }

@app.get("/api/cart")
async def get_cart():
    pool = await get_db()
    async with pool.acquire() as conn:
        items = await conn.fetch("SELECT * FROM cart")
        return items

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
