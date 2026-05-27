from fastapi import FastAPI

from app.db.init_db import init_db

from app.api.articles import router as articles_router


app = FastAPI()

init_db()

app.include_router(articles_router)

@app.get("/")
def root():
    return {"message": "Article Shelf API"}
