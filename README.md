# Support Ticket System

A full-stack support ticket application with automatic ticket classification using Gemini.

## Setup Instructions

1. Ensure Docker and Docker Compose are installed.
2. Create your environment file:

```bash
cp .env.example .env
```

3. Add your Gemini key in `.env`:

```env
GEMINI_API_KEY=your_real_key_here
```

4. Start everything:

```bash
docker-compose up --build
```

5. Open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Health check: http://localhost:8000/api/health/

## Architecture Overview

### ASCII Architecture Diagram

```text
+----------------------+        HTTP         +----------------------+
|      React UI        | <-----------------> |    Django + DRF API  |
|  (frontend:3000)     |                     |    (backend:8000)    |
+----------------------+                     +----------+-----------+
                                                        |
                                                        | ORM
                                                        v
                                              +----------------------+
                                              |   PostgreSQL (db)    |
                                              |      port 5432       |
                                              +----------------------+
                                                        |
                                                        | API call
                                                        v
                                              +----------------------+
                                              | Google Gemini API    |
                                              | gemini-1.5-flash     |
                                              +----------------------+
```

## Environment Variables

All configured in `.env.example`.

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `REACT_APP_API_URL`
- `GEMINI_API_KEY`

No secrets are hardcoded.

## LLM Integration

- Model: **Gemini `gemini-1.5-flash`**
- Package: `google-generativeai`
- Why: fast, low-latency, and cost-effective for support-ticket categorization.
- Failure-safe: if timeout/API/parsing/validation fails, API returns:

```json
{
  "suggested_category": null,
  "suggested_priority": null
}
```

## API Endpoints

### Health
- `GET /api/health/`

### Tickets
- `POST /api/tickets/` - Create a ticket
- `GET /api/tickets/` - List tickets (paginated)
  - Query params: `category`, `priority`, `status`, `search`, `ordering=newest|oldest`, `page`, `page_size`
- `PATCH /api/tickets/<id>/` - Update `status`, `category`, `priority`
- `GET /api/tickets/stats/` - Aggregated stats
- `POST /api/tickets/classify/` - LLM suggestions from description

## Example cURL Commands

Create a ticket:

```bash
curl -X POST http://localhost:8000/api/tickets/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Payment failed",
    "description": "My card payment has failed three times and I need urgent help.",
    "category": "billing",
    "priority": "high"
  }'
```

List tickets (filtered + ordering):

```bash
curl "http://localhost:8000/api/tickets/?category=billing&ordering=oldest&search=payment"
```

Update status:

```bash
curl -X PATCH http://localhost:8000/api/tickets/1/ \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

Get stats:

```bash
curl http://localhost:8000/api/tickets/stats/
```

Classify description:

```bash
curl -X POST http://localhost:8000/api/tickets/classify/ \
  -H "Content-Type: application/json" \
  -d '{"description":"Unable to login even after password reset."}'
```

## Screenshots

_Add screenshots of the dashboard here after running locally._

## Known Limitations

- Ticket list UI currently shows first page only (API supports full pagination).
- Gemini output can vary; strict validation is applied before using suggestions.
- Local development uses Django runserver (replace with Gunicorn for production deployment).

## Verification Checklist

After running `docker-compose up --build` you should see:
- PostgreSQL container healthy
- Backend waiting for DB then applying migrations automatically
- Backend listening on `0.0.0.0:8000`
- Frontend listening on `0.0.0.0:3000`
