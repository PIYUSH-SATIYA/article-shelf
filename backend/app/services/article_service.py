from __future__ import annotations

import csv
import io
import json
import re
from typing import Any

from pydantic import ValidationError
from sqlalchemy import asc, delete, desc, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.article import Article
from app.schemas.article import (
    ArticleCreate,
    ArticleUpdate,
    CsvFailedRow,
    CsvImportResult,
)


class ArticleNotFoundError(Exception):
    pass


class DuplicateUrlError(Exception):
    pass


class InvalidSortFieldError(Exception):
    pass


class InvalidSortOrderError(Exception):
    pass


class InvalidCsvError(Exception):
    pass


SORT_FIELDS: dict[str, Any] = {
    "created_at": Article.created_at,
    "updated_at": Article.updated_at,
    "priority": Article.priority,
    "title": Article.title,
}


def create_article(db: Session, payload: ArticleCreate) -> Article:
    article = Article(
        title=payload.title,
        url=str(payload.url),
        reason=payload.reason,
        notes=payload.notes,
        tags=payload.tags,
        source=payload.source,
        status=payload.status,
        priority=payload.priority,
    )

    db.add(article)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateUrlError("URL already exists") from exc

    db.refresh(article)

    return article


def list_articles(
    db: Session,
    *,
    status: str | None,
    priority: int | None,
    tag: str | None,
    search: str | None,
    limit: int | None,
    offset: int | None,
    sort_by: str | None,
    order: str | None,
) -> list[Article]:
    stmt = select(Article)

    if status is not None:
        stmt = stmt.where(Article.status == status)

    if priority is not None:
        stmt = stmt.where(Article.priority == priority)

    if search:
        stmt = stmt.where(
            or_(
                Article.title.ilike(f"%{search}%"),
                Article.reason.ilike(f"%{search}%"),
                Article.notes.ilike(f"%{search}%"),
                Article.source.ilike(f"%{search}%"),
            )
        )

    if sort_by:
        stmt = _apply_sort(stmt, sort_by=sort_by, order=order)

    if tag:
        tag_filter = tag.strip().lower()
        if tag_filter:
            articles = db.execute(stmt).scalars().all()
            articles = [
                article
                for article in articles
                if article.tags
                and any(
                    tag_filter in (tag_value or "").lower()
                    for tag_value in article.tags
                )
            ]
            return _apply_offset_limit(articles, offset=offset, limit=limit)

    if offset is not None:
        stmt = stmt.offset(offset)

    if limit is not None:
        stmt = stmt.limit(limit)

    return db.execute(stmt).scalars().all()


def get_article(db: Session, article_id: int) -> Article:
    article = db.get(Article, article_id)
    if article is None:
        raise ArticleNotFoundError("Article not found")
    return article


def update_article(db: Session, article_id: int, payload: ArticleUpdate) -> Article:
    article = db.get(Article, article_id)
    if article is None:
        raise ArticleNotFoundError("Article not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "url" in update_data and update_data["url"] is not None:
        update_data["url"] = str(update_data["url"])

    for key, value in update_data.items():
        setattr(article, key, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateUrlError("URL already exists") from exc

    db.refresh(article)

    return article


def delete_article(db: Session, article_id: int) -> None:
    article = db.get(Article, article_id)
    if article is None:
        raise ArticleNotFoundError("Article not found")

    db.delete(article)
    db.commit()


def bulk_delete(db: Session, ids: list[int]) -> int:
    if not ids:
        return 0
    result = db.execute(delete(Article).where(Article.id.in_(ids)))
    db.commit()
    return result.rowcount or 0


def bulk_update_status(db: Session, ids: list[int], status: str) -> int:
    if not ids:
        return 0
    result = db.execute(
        update(Article)
        .where(Article.id.in_(ids))
        .values(status=status)
    )
    db.commit()
    return result.rowcount or 0


def export_articles_csv(db: Session) -> str:
    articles = db.execute(select(Article).order_by(Article.id)).scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(
        [
            "id",
            "title",
            "url",
            "reason",
            "notes",
            "tags",
            "source",
            "status",
            "priority",
            "created_at",
            "updated_at",
        ]
    )

    for article in articles:
        writer.writerow(
            [
                article.id,
                article.title,
                article.url,
                article.reason or "",
                article.notes or "",
                json.dumps(article.tags or []),
                article.source or "",
                article.status,
                article.priority,
                _format_datetime(article.created_at),
                _format_datetime(article.updated_at),
            ]
        )

    return output.getvalue()


def import_articles_csv(db: Session, csv_text: str) -> CsvImportResult:
    reader = csv.DictReader(io.StringIO(csv_text))
    if not reader.fieldnames:
        raise InvalidCsvError("CSV header is missing")

    header_map = {name.strip().lower(): name for name in reader.fieldnames if name}
    required_headers = {"title", "url"}
    missing = required_headers - set(header_map)
    if missing:
        missing_list = ", ".join(sorted(missing))
        raise InvalidCsvError(f"Missing required headers: {missing_list}")

    existing_urls = set(db.execute(select(Article.url)).scalars().all())
    new_urls: set[str] = set()

    imported_count = 0
    skipped_count = 0
    failed_rows: list[CsvFailedRow] = []

    for row_number, row in enumerate(reader, start=2):
        if not any(row.values()):
            failed_rows.append(CsvFailedRow(row_number=row_number, reason="Empty row"))
            continue

        title = _clean_value(row.get(header_map["title"]))
        url = _clean_value(row.get(header_map["url"]))

        if not title or not url:
            failed_rows.append(
                CsvFailedRow(
                    row_number=row_number,
                    reason="Missing required fields: title and url",
                )
            )
            continue

        if url in existing_urls or url in new_urls:
            skipped_count += 1
            continue

        try:
            payload = ArticleCreate(
                title=title,
                url=url,
                reason=_clean_value(row.get(header_map.get("reason", ""))),
                notes=_clean_value(row.get(header_map.get("notes", ""))),
                tags=_parse_tags(_clean_value(row.get(header_map.get("tags", "")))),
                source=_clean_value(row.get(header_map.get("source", ""))),
                status=_clean_value(row.get(header_map.get("status", "")))
                or ArticleCreate.model_fields["status"].default,
                priority=_parse_int(
                    _clean_value(row.get(header_map.get("priority", ""))),
                    ArticleCreate.model_fields["priority"].default,
                ),
            )
        except (ValidationError, ValueError) as exc:
            failed_rows.append(CsvFailedRow(row_number=row_number, reason=str(exc)))
            continue

        article = Article(
            title=payload.title,
            url=str(payload.url),
            reason=payload.reason,
            notes=payload.notes,
            tags=payload.tags,
            source=payload.source,
            status=payload.status,
            priority=payload.priority,
        )

        db.add(article)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            skipped_count += 1
            continue

        imported_count += 1
        new_urls.add(url)

    return CsvImportResult(
        imported_count=imported_count,
        skipped_count=skipped_count,
        failed_rows=failed_rows,
    )


def _apply_sort(stmt, *, sort_by: str, order: str | None):
    column = SORT_FIELDS.get(sort_by)
    if column is None:
        raise InvalidSortFieldError("Invalid sort_by field")

    direction = (order or "asc").lower()
    if direction == "asc":
        return stmt.order_by(asc(column))
    if direction == "desc":
        return stmt.order_by(desc(column))

    raise InvalidSortOrderError("Invalid order value")


def _apply_offset_limit(
    items: list[Article],
    *,
    offset: int | None,
    limit: int | None,
) -> list[Article]:
    start = offset or 0
    end = start + limit if limit is not None else None
    return items[start:end]


def _format_datetime(value) -> str:
    if value is None:
        return ""
    return value.isoformat()


def _clean_value(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _parse_tags(value: str | None) -> list[str] | None:
    if not value:
        return None

    raw = value.strip()
    if not raw:
        return None

    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
            return [str(parsed).strip()]
        except json.JSONDecodeError:
            pass

    parts = [part.strip() for part in re.split(r"[;,]", raw)]
    tags = [part for part in parts if part]
    return tags or None


def _parse_int(value: str | None, default: int) -> int:
    if value is None:
        return default
    return int(value)
