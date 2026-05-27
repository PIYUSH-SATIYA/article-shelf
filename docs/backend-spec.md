# Backend Spec

## Stack

- FastAPI
- SQLite
- SQLAlchemy
- Pydantic

## Responsibilities

- Store articles
- CRUD APIs
- Search/filter APIs
- CSV import/export
- Tag/status management

## Database

Single `articles` table.

## API Endpoints

GET /articles
GET /articles/:id
POST /articles
PUT /articles/:id
DELETE /articles/:id

POST /import/csv
GET /export/csv

## Constraints

- Single user only
- No auth
- No AI features
- No background workers
