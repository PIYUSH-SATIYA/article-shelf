from fastapi import APIRouter, Query, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session, query

from app.db.dependencies import get_db

from app.models.article import Article

from app.schemas.article import (
    ArticleCreate,
    ArticleResponse,
    ArticleUpdate
)

router = APIRouter()

@router.post(
    "/articles",
    response_model=ArticleResponse
)

def create_article(payload: ArticleCreate,     db: Session = Depends(get_db)
):
    article = Article(
        title=payload.title,
        url=str(payload.url),
        reason=payload.reason,
        notes=payload.notes,
        tags=payload.tags,
        source=payload.source,
        status=payload.status,
        priority=payload.priority
    )

    db.add(article)

    db.commit()

    db.refresh(article)

    return article

@router.get(
    "/articles",
    response_model=list[ArticleResponse]
)

def get_articles(
    status: str | None = None,
    priority: int | None = None,
    tag: str | None = None,
    db: Session = Depends(get_db),
    search: str | None = None
):
    query = db.query(Article)
 
    if status :
        query = query.filter(Article.status == status)

    if priority :
        query = query.filter(Article.priority == priority)

    if search :
        query = query.filter(
            or_(
                Article.title.ilike(f"%{search}%"),
                Article.reason.ilike(f"%{search}%"),
                Article.notes.ilike(f"%{search}%"),
                Article.source.ilike(f"%{search}%")
            )
        )

    articles = query.all()

    if tag: 
        articles = [
            article
            for article in articles
            if article.tags and tag in article.tags
        ]

    return articles

@router.delete("/articles/{article_id}")

def delete_article(article_id: int,     db: Session = Depends(get_db)
):


    article = (
        db.query(Article)
        .filter(Article.id == article_id)
        .first()
    )

    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    db.delete(article)

    db.commit()

    return {
        "message": "Article deleted successfully"
    }

@router.get("/articles/{article_id}")

def get_articles_by_id(article_id: int,     db: Session = Depends(get_db)
):

    article = (
        db.query(Article)
        .filter(Article.id == article_id)
        .first()
    )

    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    return article

@router.patch(
    "/articles/{article_id}",
   response_model=ArticleUpdate
)

def edit_article(
    article_id: int,
    payload: ArticleUpdate,
        db: Session = Depends(get_db)

):

    article = (
        db.query(Article)
        .filter(Article.id == article_id)
        .first()
    )

    if article is None:
        raise HTTPException(
            status_code=404,
            detail="Article not found"
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(article, key, value)

    db.commit()

    db.refresh(article)

    return article
