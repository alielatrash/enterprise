"""FastAPI application with admin endpoints"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from app.config import settings
from app.database import engine, init_db
from app.models import Digest, Source
from app.scheduler import DigestScheduler

# Initialize scheduler
scheduler = DigestScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("\n" + "=" * 60)
    print("MENA Daily Digest Service")
    print("=" * 60 + "\n")

    # Initialize database
    init_db()

    # Start scheduler
    scheduler.start()

    yield

    # Shutdown
    scheduler.stop()
    print("\n✓ Service stopped\n")


# Create FastAPI app
app = FastAPI(
    title="MENA Daily Digest",
    description="Daily news digest aggregator for MENA region",
    version="1.0.0",
    lifespan=lifespan,
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main web interface"""
    return FileResponse("static/index.html")


@app.get("/archive", response_class=HTMLResponse)
async def archive_page():
    """Serve the archive page"""
    return FileResponse("static/archive.html")


@app.get("/about", response_class=HTMLResponse)
async def about_page():
    """Serve the about page"""
    return FileResponse("static/about.html")


@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "service": "MENA Daily Digest",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "run": "POST /run",
            "latest": "/latest",
            "digests": "/digests",
            "sources": "/sources",
        },
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timezone": settings.tz,
        "schedule": f"{settings.digest_schedule_hour:02d}:{settings.digest_schedule_minute:02d}",
    }


@app.post("/run")
async def run_digest(date: Optional[str] = None):
    """
    Manually trigger digest generation

    Args:
        date: Optional date string (YYYY-MM-DD), defaults to today
    """
    try:
        print(f"\n[API] Manual digest run triggered (date={date or 'today'})")
        digest = await scheduler.run_now() if not date else await scheduler.pipeline.run(date)

        if digest:
            return {
                "status": "success",
                "digest_id": digest.id,
                "date": digest.date,
                "html_path": digest.html_path,
                "md_path": digest.md_path,
            }
        else:
            raise HTTPException(status_code=500, detail="Digest generation failed")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/latest")
async def get_latest_digest(format: str = "html"):
    """
    Get the latest digest

    Args:
        format: Output format ('html', 'md', or 'json')
    """
    with Session(engine) as session:
        # Get latest digest
        statement = select(Digest).order_by(Digest.created_at.desc()).limit(1)
        digest = session.exec(statement).first()

        if not digest:
            raise HTTPException(status_code=404, detail="No digests found")

        if format == "json":
            return {
                "digest": {
                    "id": digest.id,
                    "date": digest.date,
                    "tldr": digest.tl_dr,
                    "sections": digest.items if isinstance(digest.items, dict) else {},
                    "html_path": digest.html_path,
                    "md_path": digest.md_path,
                }
            }
        elif format == "md":
            if not digest.md_path or not Path(digest.md_path).exists():
                raise HTTPException(status_code=404, detail="Markdown file not found")
            return FileResponse(digest.md_path, media_type="text/markdown")
        else:  # html
            if not digest.html_path or not Path(digest.html_path).exists():
                raise HTTPException(status_code=404, detail="HTML file not found")
            return FileResponse(digest.html_path, media_type="text/html")


@app.get("/digests")
async def list_digests(limit: int = 10):
    """
    List recent digests

    Args:
        limit: Number of digests to return (max 100)
    """
    limit = min(limit, 100)

    with Session(engine) as session:
        statement = select(Digest).order_by(Digest.created_at.desc()).limit(limit)
        digests = session.exec(statement).all()

        return {
            "count": len(digests),
            "digests": [
                {
                    "id": d.id,
                    "date": d.date,
                    "tldr": d.tl_dr,
                    "created_at": d.created_at.isoformat(),
                }
                for d in digests
            ],
        }


@app.get("/digest/{digest_id}", response_class=HTMLResponse)
async def view_digest_page(digest_id: int):
    """Serve a digest viewing page"""
    return FileResponse("static/digest.html")


@app.get("/digests/{digest_id}")
async def get_digest(digest_id: int, format: str = "json"):
    """
    Get a specific digest by ID

    Args:
        digest_id: Digest ID
        format: Output format ('html', 'md', or 'json')
    """
    with Session(engine) as session:
        digest = session.get(Digest, digest_id)

        if not digest:
            raise HTTPException(status_code=404, detail="Digest not found")

        if format == "json":
            return {
                "digest": {
                    "id": digest.id,
                    "date": digest.date,
                    "tldr": digest.tl_dr,
                    "sections": digest.items if isinstance(digest.items, dict) else {},
                    "html_path": digest.html_path,
                    "md_path": digest.md_path,
                }
            }
        elif format == "md":
            if not digest.md_path or not Path(digest.md_path).exists():
                raise HTTPException(status_code=404, detail="Markdown file not found")
            return FileResponse(digest.md_path, media_type="text/markdown")
        else:  # html
            if not digest.html_path or not Path(digest.html_path).exists():
                raise HTTPException(status_code=404, detail="HTML file not found")
            return FileResponse(digest.html_path, media_type="text/html")


@app.get("/sources")
async def list_sources():
    """List all configured sources"""
    with Session(engine) as session:
        sources = session.exec(select(Source)).all()

        return {
            "count": len(sources),
            "sources": [
                {
                    "id": s.id,
                    "name": s.name,
                    "type": s.type,
                    "is_active": s.is_active,
                    "config": s.config,
                }
                for s in sources
            ],
        }


@app.post("/sources")
async def create_source(name: str, type: str, config: dict, is_active: bool = True):
    """
    Create a new source

    Args:
        name: Source name
        type: Source type (gmail, rss, reuters)
        config: Source configuration dict
        is_active: Whether source is active
    """
    with Session(engine) as session:
        source = Source(name=name, type=type, is_active=is_active)
        source.config = config

        session.add(source)
        session.commit()
        session.refresh(source)

        return {
            "id": source.id,
            "name": source.name,
            "type": source.type,
            "is_active": source.is_active,
        }


@app.patch("/sources/{source_id}")
async def update_source(
    source_id: int,
    name: Optional[str] = None,
    config: Optional[dict] = None,
    is_active: Optional[bool] = None,
):
    """
    Update a source

    Args:
        source_id: Source ID
        name: Optional new name
        config: Optional new config
        is_active: Optional active status
    """
    with Session(engine) as session:
        source = session.get(Source, source_id)

        if not source:
            raise HTTPException(status_code=404, detail="Source not found")

        if name is not None:
            source.name = name
        if config is not None:
            source.config = config
        if is_active is not None:
            source.is_active = is_active

        session.add(source)
        session.commit()
        session.refresh(source)

        return {
            "id": source.id,
            "name": source.name,
            "type": source.type,
            "is_active": source.is_active,
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.app_host, port=settings.app_port)
