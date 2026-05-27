from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.dependencies import get_db

from app.schemas.article import (
    ArticleCreate,
    ArticleResponse,
    ArticleUpdate,
    BulkDeleteResult,
    BulkIds,
    BulkStatusUpdate,
    BulkUpdateResult,
    CsvImportResult,
)
from app.services import article_service
from app.services.article_service import (
    ArticleNotFoundError,
    DuplicateUrlError,
    InvalidCsvError,
    InvalidSortFieldError,
    InvalidSortOrderError,
)

router = APIRouter()

@router.post(
    "/articles",
    response_model=ArticleResponse
)

def create_article(payload: ArticleCreate, db: Session = Depends(get_db)):
    try:
        return article_service.create_article(db, payload)
    except DuplicateUrlError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

@router.get(
    "/articles",
    response_model=list[ArticleResponse]
)

def get_articles(
    status: str | None = None,
    priority: int | None = None,
    tag: str | None = None,
    search: str | None = None,
    limit: int | None = Query(None, ge=1),
    offset: int | None = Query(None, ge=0),
    sort_by: str | None = None,
    order: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        return article_service.list_articles(
            db,
            status=status,
            priority=priority,
            tag=tag,
            search=search,
            limit=limit,
            offset=offset,
            sort_by=sort_by,
            order=order,
        )
    except InvalidSortFieldError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except InvalidSortOrderError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

@router.delete("/articles/{article_id}")
def delete_article(article_id: int, db: Session = Depends(get_db)):
    try:
        article_service.delete_article(db, article_id)
    except ArticleNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return {"message": "Article deleted successfully"}

@router.get("/articles/{article_id}")
def get_articles_by_id(article_id: int, db: Session = Depends(get_db)):
    try:
        return article_service.get_article(db, article_id)
    except ArticleNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

@router.patch(
    "/articles/{article_id}",
    response_model=ArticleResponse
)

def edit_article(
    article_id: int,
    payload: ArticleUpdate,
    db: Session = Depends(get_db),
):
    try:
        return article_service.update_article(db, article_id, payload)
    except ArticleNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except DuplicateUrlError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post("/articles/bulk/delete", response_model=BulkDeleteResult)
def bulk_delete_articles(payload: BulkIds, db: Session = Depends(get_db)):
    deleted_count = article_service.bulk_delete(db, payload.ids)
    return BulkDeleteResult(deleted_count=deleted_count)


@router.post("/articles/bulk/archive", response_model=BulkUpdateResult)
def bulk_archive_articles(payload: BulkIds, db: Session = Depends(get_db)):
    updated_count = article_service.bulk_update_status(db, payload.ids, "archived")
    return BulkUpdateResult(updated_count=updated_count)


@router.patch("/articles/bulk/status", response_model=BulkUpdateResult)
def bulk_update_articles_status(
    payload: BulkStatusUpdate,
    db: Session = Depends(get_db),
):
    updated_count = article_service.bulk_update_status(
        db,
        payload.ids,
        payload.status,
    )
    return BulkUpdateResult(updated_count=updated_count)


@router.get("/articles/export/csv")
def export_articles_csv(db: Session = Depends(get_db)):
    csv_content = article_service.export_articles_csv(db)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="articles.csv"'},
    )


@router.post("/articles/import/csv", response_model=CsvImportResult)
def import_articles_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        csv_text = file.file.read().decode("utf-8", errors="replace")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to read CSV file",
        ) from exc

    try:
        return article_service.import_articles_csv(db, csv_text)
    except InvalidCsvError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
