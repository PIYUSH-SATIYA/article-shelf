from datetime import datetime

from pydantic import BaseModel
from pydantic import HttpUrl


class ArticleCreate(BaseModel):
    title: str
    url: HttpUrl

    reason: str | None = None
    notes: str | None = None

    tags: list[str] | None = None

    source: str | None = None

    status: str = "inbox"

    priority: int = 1


class ArticleResponse(BaseModel):
    id: int

    title: str
    url: HttpUrl

    reason: str | None
    notes: str | None

    tags: list[str] | None

    source: str | None

    status: str
    priority: int

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class ArticleUpdate(BaseModel):
    title: str | None = None

    url: HttpUrl | None = None

    reason: str | None = None

    notes: str | None = None

    tags: list[str] | None = None

    source: str | None = None

    status: str | None = None

    priority: int | None = None


class BulkIds(BaseModel):
    ids: list[int]


class BulkStatusUpdate(BaseModel):
    ids: list[int]
    status: str


class BulkDeleteResult(BaseModel):
    deleted_count: int


class BulkUpdateResult(BaseModel):
    updated_count: int


class CsvFailedRow(BaseModel):
    row_number: int
    reason: str


class CsvImportResult(BaseModel):
    imported_count: int
    skipped_count: int
    failed_rows: list[CsvFailedRow]
