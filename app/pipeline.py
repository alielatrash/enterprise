"""Main digest generation pipeline"""

from datetime import datetime, timedelta
from typing import List, Optional

import pytz
from sqlmodel import Session, select

from app.config import load_sources_config, settings
from app.database import engine
from app.delivery import EmailDelivery, TelegramDelivery, WhatsAppDelivery
from app.models import Article, Digest, Source
from app.processors import ArticleClassifier, ArticleDeduplicator, ArticleNormalizer, ArticleRanker
from app.renderer import DigestRenderer
from app.summarizer import ArticleSummarizer
from ingestors import GmailIngestor, ReutersIngestor, RSSIngestor


class DigestPipeline:
    """Main pipeline for generating and delivering daily digest"""

    def __init__(self):
        self.normalizer = ArticleNormalizer()
        self.classifier = ArticleClassifier()
        self.deduplicator = ArticleDeduplicator()
        self.ranker = ArticleRanker()
        self.summarizer = ArticleSummarizer()
        self.renderer = DigestRenderer()
        self.email_delivery = EmailDelivery()
        self.whatsapp_delivery = WhatsAppDelivery()
        self.telegram_delivery = TelegramDelivery()

    async def run(self, date: Optional[str] = None) -> Optional[Digest]:
        """
        Run the complete digest pipeline

        Args:
            date: Date string (YYYY-MM-DD) or None for today

        Returns:
            Generated Digest object or None if failed
        """
        # Get date in Cairo timezone
        cairo_tz = pytz.timezone(settings.tz)
        if date:
            digest_date = datetime.strptime(date, "%Y-%m-%d")
            digest_date = cairo_tz.localize(digest_date)
        else:
            digest_date = datetime.now(cairo_tz)

        date_str = digest_date.strftime("%Y-%m-%d")

        print(f"\n{'='*60}")
        print(f"Starting digest generation for {date_str}")
        print(f"{'='*60}\n")

        try:
            # Step 1: Initialize sources
            print("Step 1: Loading sources...")
            await self._init_sources()

            # Step 2: Fetch articles
            print("\nStep 2: Fetching articles...")
            since = digest_date - timedelta(hours=24)
            articles = await self._fetch_articles(since)
            print(f"  Fetched {len(articles)} raw articles")

            if not articles:
                print("  No articles found, creating empty digest")
                return await self._create_empty_digest(date_str)

            # Step 3: Normalize
            print("\nStep 3: Normalizing articles...")
            articles = await self.normalizer.normalize_batch(articles)
            print(f"  Normalized {len(articles)} articles")

            # Step 4: Classify
            print("\nStep 4: Classifying articles...")
            articles = self.classifier.classify_batch(articles)
            print(f"  Classified {len(articles)} articles")

            # Step 5: Deduplicate
            print("\nStep 5: Deduplicating articles...")
            articles = self.deduplicator.deduplicate(articles)
            print(f"  Remaining after deduplication: {len(articles)} articles")

            # Step 6: Save to database
            print("\nStep 6: Saving articles to database...")
            await self._save_articles(articles)

            # Step 7: Rank articles
            print("\nStep 7: Ranking articles...")
            source_map = await self._get_source_map()
            articles = self.ranker.rank(articles, source_map)
            top_articles = self.ranker.top_k(articles, k=10)
            print(f"  Top {len(top_articles)} articles selected")

            # Step 8: Generate summary
            print("\nStep 8: Generating AI summary...")
            summary = await self.summarizer.summarize(top_articles, date_str)
            print(f"  TL;DR: {summary['tl_dr'][:100]}...")

            # Step 9: Render digest
            print("\nStep 9: Rendering digest...")
            paths = self.renderer.render(summary, date_str)
            print(f"  HTML: {paths['html_path']}")
            print(f"  Markdown: {paths['md_path']}")

            # Step 10: Save digest to database
            print("\nStep 10: Saving digest to database...")
            digest = await self._save_digest(date_str, summary, paths, top_articles)

            # Step 11: Deliver
            print("\nStep 11: Delivering digest...")
            await self._deliver_digest(date_str, summary, paths, top_articles)

            print(f"\n{'='*60}")
            print(f"✓ Digest generation complete for {date_str}")
            print(f"{'='*60}\n")

            return digest

        except Exception as e:
            print(f"\n✗ Error in digest pipeline: {e}")
            import traceback

            traceback.print_exc()
            return None

    async def _init_sources(self):
        """Initialize sources from YAML config if not already in database"""
        with Session(engine) as session:
            # Check if sources already exist
            existing_count = session.exec(select(Source)).all()
            if existing_count:
                print(f"  Found {len(existing_count)} existing sources")
                return

            # Load from YAML
            config = load_sources_config()
            sources = config.get("sources", [])

            for source_config in sources:
                source = Source(
                    name=source_config["name"],
                    type=source_config["type"],
                    is_active=source_config.get("is_active", True),
                )
                source.config = source_config.get("config", {})

                session.add(source)

            session.commit()
            print(f"  Initialized {len(sources)} sources from config")

    async def _fetch_articles(self, since: datetime) -> List[Article]:
        """Fetch articles from all active sources"""
        articles = []

        with Session(engine) as session:
            sources = session.exec(select(Source).where(Source.is_active == True)).all()

            for source in sources:
                try:
                    print(f"  Fetching from {source.name} ({source.type})...")

                    # Create appropriate ingestor
                    if source.type == "gmail":
                        ingestor = GmailIngestor(source.id, source.config)
                    elif source.type == "rss":
                        ingestor = RSSIngestor(source.id, source.config)
                    elif source.type == "reuters":
                        ingestor = ReutersIngestor(source.id, source.config)
                    else:
                        print(f"    Unknown source type: {source.type}")
                        continue

                    # Fetch articles
                    source_articles = await ingestor.fetch_articles(since)
                    print(f"    Got {len(source_articles)} articles")
                    articles.extend(source_articles)

                except Exception as e:
                    print(f"    Error fetching from {source.name}: {e}")
                    continue

        return articles

    async def _save_articles(self, articles: List[Article]):
        """Save articles to database"""
        with Session(engine) as session:
            for article in articles:
                session.add(article)
            session.commit()
        print(f"  Saved {len(articles)} articles")

    async def _get_source_map(self) -> dict:
        """Get source ID to info mapping"""
        with Session(engine) as session:
            sources = session.exec(select(Source)).all()
            return {
                source.id: {"name": source.name, "type": source.type} for source in sources
            }

    async def _save_digest(
        self, date_str: str, summary: dict, paths: dict, articles: List[Article]
    ) -> Digest:
        """Save digest to database"""
        with Session(engine) as session:
            # Create items JSON
            items = [
                {
                    "id": article.id,
                    "title": article.title,
                    "url": article.url,
                    "score": article.score,
                }
                for article in articles
            ]

            digest = Digest(
                date=date_str,
                tl_dr=summary.get("tl_dr", ""),
                html_path=paths.get("html_path"),
                md_path=paths.get("md_path"),
            )
            digest.items = items

            session.add(digest)
            session.commit()
            session.refresh(digest)

            print(f"  Saved digest ID: {digest.id}")
            return digest

    async def _deliver_digest(
        self, date_str: str, summary: dict, paths: dict, articles: List[Article]
    ):
        """Deliver digest via configured channels"""
        # Email
        if settings.digest_email_to:
            print("  Sending email...")
            success = await self.email_delivery.send_digest(
                date_str, paths["html_path"], paths["md_path"]
            )
            if success:
                print("    ✓ Email sent")
            else:
                print("    ✗ Email failed")

        # WhatsApp (optional)
        if self.whatsapp_delivery.enabled:
            print("  Sending WhatsApp...")
            top_links = [{"title": a.title, "url": a.url} for a in articles[:5]]
            success = await self.whatsapp_delivery.send_digest_summary(
                date_str, summary.get("tl_dr", ""), top_links
            )
            if success:
                print("    ✓ WhatsApp sent")
            else:
                print("    ✗ WhatsApp failed")

        # Telegram (optional)
        if self.telegram_delivery.enabled:
            print("  Sending Telegram...")
            top_links = [{"title": a.title, "url": a.url} for a in articles[:5]]
            success = await self.telegram_delivery.send_digest_summary(
                date_str, summary.get("tl_dr", ""), top_links
            )
            if success:
                print("    ✓ Telegram sent")
            else:
                print("    ✗ Telegram failed")

    async def _create_empty_digest(self, date_str: str) -> Digest:
        """Create empty digest when no articles found"""
        summary = {
            "tl_dr": "No major updates today.",
            "sections": {},
        }

        paths = self.renderer.render(summary, date_str)
        digest = await self._save_digest(date_str, summary, paths, [])
        await self._deliver_digest(date_str, summary, paths, [])

        return digest
