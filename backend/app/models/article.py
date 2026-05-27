from datetime import datetime

from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy import DateTime
from sqlalchemy import JSON
from sqlalchemy import func

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.db.base import Base

class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(
        Integer,
        autoincrement=True,
        primary_key=True
    )

    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    url: Mapped[str] = mapped_column(
        String(2000),
        unique=True,
        nullable=False
    )

    reason: Mapped[str | None]

    notes: Mapped[str | None]

    tags: Mapped[list[str] | None] = mapped_column(
        JSON
    )

    source: Mapped[str | None]

    status: Mapped[str] = mapped_column(
        String(50),
        default="unread"
    )

    priority: Mapped[int] = mapped_column(
        Integer,
        default=1
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    summary: Mapped[str | None]
