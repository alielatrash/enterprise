# MENA Daily Digest

A production-ready news digest service that aggregates, deduplicates, ranks, and summarizes MENA (Middle East & North Africa) news from multiple sources including Enterprise Egypt newsletters, Reuters, and RSS feeds.

## Features

- **Multi-Source Ingestion**: Gmail (Enterprise newsletters), Reuters API/RSS, generic RSS feeds
- **Smart Processing**: Automatic normalization, classification, deduplication, and ranking
- **AI Summarization**: Claude or OpenAI-powered TL;DR generation with sectioned bullets
- **Multiple Delivery**: Email (SendGrid/SMTP), WhatsApp (Twilio), Telegram
- **Scheduled Execution**: Daily automated runs at 08:30 Cairo time
- **REST API**: FastAPI-based admin interface for manual triggers and digest viewing
- **Timezone-Aware**: All operations in Africa/Cairo timezone

## Architecture

```
┌─────────────────┐
│   Sources       │
│  - Gmail        │
│  - Reuters      │
│  - RSS Feeds    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Ingestors     │
│  - Fetch        │
│  - Parse        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Processors     │
│  - Normalize    │
│  - Classify     │
│  - Deduplicate  │
│  - Rank         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Summarizer     │
│  - Claude/GPT   │
│  - Fallback     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Renderer      │
│  - HTML         │
│  - Markdown     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Delivery      │
│  - Email        │
│  - WhatsApp     │
│  - Telegram     │
└─────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- Gmail account (for Enterprise newsletters)
- SendGrid API key or SMTP credentials (for email delivery)
- Anthropic or OpenAI API key (for AI summarization)
- Optional: Reuters API key, Twilio account, Telegram bot

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mena-digest

# Run setup
make setup

# Copy and edit environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Configuration

#### 1. Environment Variables (.env)

Edit `.env` with your credentials:

```bash
# Required
ANTHROPIC_API_KEY=your-anthropic-key  # or OPENAI_API_KEY
SENDGRID_API_KEY=your-sendgrid-key    # or SMTP credentials
DIGEST_EMAIL_TO=recipient@example.com

# Gmail (for Enterprise newsletters)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GMAIL_LABEL=Enterprise-Forward

# Optional
REUTERS_API_KEY=your-reuters-key      # Falls back to RSS if not provided
TWILIO_ACCOUNT_SID=your-twilio-sid
TELEGRAM_BOT_TOKEN=your-bot-token
```

#### 2. Gmail Setup (for Enterprise newsletters)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Desktop app)
5. Download credentials as `credentials.json` in project root
6. First run will open browser for authentication
7. Token saved to `token.json` for future use

#### 3. Sources Configuration (sources.yaml)

Add or modify RSS feeds in `sources.yaml`:

```yaml
sources:
  - name: My Custom Feed
    type: rss
    is_active: true
    config:
      url: https://example.com/feed.xml
```

### Running Locally

```bash
# Start the FastAPI server with scheduler
make dev

# The service will:
# - Start API server on http://localhost:8000
# - Schedule daily digest at 08:30 Cairo time
# - Provide admin endpoints for manual triggers
```

### Manual Trigger

```bash
# Via API
curl -X POST http://localhost:8000/run

# Via Python
python -c "
import asyncio
from app.pipeline import DigestPipeline

asyncio.run(DigestPipeline().run())
"
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Manual Digest Run
```bash
POST /run?date=2024-01-15  # Optional date parameter
```

### Get Latest Digest
```bash
GET /latest?format=html   # or json, md
```

### List Digests
```bash
GET /digests?limit=10
```

### Get Specific Digest
```bash
GET /digests/{id}?format=html
```

### Manage Sources
```bash
GET  /sources           # List all sources
POST /sources           # Create new source
PATCH /sources/{id}     # Update source
```

## Output Format

### TL;DR Email Example

```
Subject: MENA Daily TL;DR — 2024-01-15

TL;DR: Egypt's central bank raises rates to combat inflation...

🇪🇬 Egypt
- CBE raises interest rates by 200 basis points (reuters.com/...)
- Suez Canal revenues reach record high (enterprise.press/...)

🇸🇦 Saudi Arabia
- Saudi Aramco announces new IPO plans (reuters.com/...)

🚢 Logistics & Shipping
- DP World expands operations in Egypt (thenationalnews.com/...)

📋 Policy & Regulation
- New tax reforms announced across GCC (arabnews.com/...)
```

### Output Files

Digests saved to `out/YYYY-MM-DD/`:
- `digest.html` - Styled HTML version
- `digest.md` - Markdown version

## Deployment

### Docker

```bash
# Build image
make docker-build

# Run container
make docker-run

# Or manually
docker build -t mena-digest .
docker run -p 8000:8000 --env-file .env mena-digest
```

### GitHub Actions

The included workflow (`.github/workflows/daily-digest.yml`) runs daily at 06:30 UTC (08:30 Cairo).

**Setup:**

1. Go to repository Settings → Secrets and variables → Actions
2. Add secrets for all required env vars (see `.env.example`)
3. Workflow will run automatically or can be triggered manually

**Required Secrets:**
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- `SENDGRID_API_KEY` or SMTP credentials
- `DIGEST_EMAIL_TO`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GMAIL_TOKEN` (after first local auth)
- Optional: `REUTERS_API_KEY`, `TWILIO_*`, `TELEGRAM_*`

## Testing

```bash
# Run all tests
make test

# Run specific test file
pytest tests/test_classifier.py -v

# Run with coverage
pytest --cov=app --cov-report=html
```

## Architecture Details

### Data Models

- **Source**: News source configuration (Gmail, RSS, Reuters)
- **Article**: Individual news article with metadata
- **Digest**: Daily digest with summary and article references

### Processing Pipeline

1. **Ingestion**: Fetch from all active sources
2. **Normalization**: Clean titles, normalize URLs, extract canonical links
3. **Classification**: Tag by region (Egypt, KSA, UAE, MENA) and section (Logistics, Policy, General)
4. **Deduplication**: Remove duplicates based on URL/title hashing
5. **Ranking**: Score by recency (36h half-life) + source weight + keyword boost
6. **Summarization**: Generate TL;DR and sectioned bullets via LLM
7. **Rendering**: Create HTML and Markdown outputs
8. **Delivery**: Send via email, WhatsApp, Telegram

### Region Classification

Automatically tags articles as:
- **EGYPT**: Egypt, Cairo, Suez, Alexandria, CBE
- **KSA**: Saudi Arabia, Riyadh, Jeddah, NEOM
- **UAE**: UAE, Dubai, Abu Dhabi, Emirates
- **MENA**: General Middle East/North Africa
- **OTHER**: Rest of world

### Section Classification

Automatically tags articles as:
- **LOGISTICS_SHIPPING**: Ports, cargo, vessels, supply chain
- **POLICY_REGULATION**: Laws, government, taxes, central banks
- **GENERAL**: Everything else

### Ranking Algorithm

Score = Recency × Source Weight × Keyword Boost

- **Recency**: Exponential decay (2^(-age/36h))
- **Source Weights**: Reuters (2.0), Enterprise (1.8), Others (1.0)
- **Keyword Boosts**: FX (1.5), IPO (1.5), Oil (1.3), Budget (1.4), etc.

## Compliance

- **Gmail**: Uses OAuth2 for personal mailbox access via Gmail API
- **Reuters**: Supports official API or falls back to public RSS
- **RSS**: Respects rate limits and caching headers (ETag, Last-Modified)
- **LLM**: Anthropic Claude or OpenAI with fallback to extractive summarization

## Troubleshooting

### Gmail Authentication Issues

```bash
# Remove old token and re-authenticate
rm token.json
python -c "
from ingestors.gmail_enterprise import GmailIngestor
ingestor = GmailIngestor(1, {'label': 'Test'})
ingestor._get_credentials()
"
```

### No Articles Fetched

1. Check source configuration in `sources.yaml`
2. Verify API keys in `.env`
3. Check RSS feed URLs are accessible
4. Review logs for specific errors

### Email Not Sending

1. Verify SendGrid API key or SMTP credentials
2. Check `DIGEST_EMAIL_TO` is set
3. Review delivery logs in console output

### LLM Summarization Fails

1. Check `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
2. Service falls back to extractive summarization
3. Review rate limits and API quotas

## Development

### Project Structure

```
mena-digest/
├── app/
│   ├── __init__.py
│   ├── config.py          # Configuration
│   ├── database.py        # Database setup
│   ├── models.py          # SQLModel models
│   ├── pipeline.py        # Main orchestration
│   ├── scheduler.py       # APScheduler
│   ├── summarizer.py      # LLM summarization
│   ├── renderer.py        # Template rendering
│   ├── main.py            # FastAPI app
│   ├── processors/        # Processing modules
│   │   ├── normalizer.py
│   │   ├── classifier.py
│   │   ├── deduplicator.py
│   │   └── ranker.py
│   └── delivery/          # Delivery services
│       ├── email.py
│       ├── whatsapp.py
│       └── telegram.py
├── ingestors/             # Source ingestors
│   ├── base.py
│   ├── gmail_enterprise.py
│   ├── rss.py
│   └── reuters.py
├── templates/             # Jinja2 templates
│   ├── digest.html.j2
│   └── digest.md.j2
├── tests/                 # Unit tests
├── .env.example           # Environment template
├── sources.yaml           # Source configuration
├── requirements.txt       # Python dependencies
├── Dockerfile            # Container build
├── Makefile              # Development commands
└── README.md             # This file
```

### Adding New Sources

1. Create ingestor in `ingestors/` extending `BaseIngestor`
2. Add source type to `models.py`
3. Register in `pipeline.py` fetch logic
4. Add to `sources.yaml`

### Customizing Classification

Edit keyword lists in `app/processors/classifier.py`:
- `REGION_KEYWORDS`: Add country/city names
- `SECTION_KEYWORDS`: Add industry terms

## Performance

- **Typical run time**: 30-60 seconds
- **Sources**: Parallel fetching
- **Database**: SQLite (dev), PostgreSQL-ready
- **Caching**: RSS ETag/Last-Modified support
- **Rate limiting**: Respects source limits

## License

MIT License - See LICENSE file

## Acceptance Criteria ✓

- [x] Works without Reuters API key (RSS fallback)
- [x] Adding RSS feed in `sources.yaml` works without code changes
- [x] Digest email shows TL;DR + ≤10 bullets with links
- [x] Time labels show Cairo timezone
- [x] Complete in <60s with typical load
- [x] Tests for tagger, dedupe, ranking
- [x] GitHub Action for daily cron
- [x] Full setup instructions in README

## Roadmap

- [ ] PostgreSQL support for production
- [ ] Web UI for digest viewing
- [ ] Article sentiment analysis
- [ ] Custom LLM prompt templates
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Export to PDF
- [ ] Webhook integrations

---

**Built with**: Python 3.11 • FastAPI • SQLModel • APScheduler • Claude/OpenAI • SendGrid • Twilio
