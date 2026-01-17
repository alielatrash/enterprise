"""Reuters ingestor with API and RSS fallback"""

from datetime import datetime, timezone
from typing import List, Optional

import httpx

from app.config import settings
from app.models import Article

from .base import BaseIngestor
from .rss import RSSIngestor


class ReutersIngestor(BaseIngestor):
    """Reuters ingestor with API fallback to RSS"""

    REUTERS_API_BASE = "https://wireapi.reuters.com/v8"
    REUTERS_RSS_URLS = {
        "middle-east": "https://www.reuters.com/world/middle-east/rss",
        "africa": "https://www.reuters.com/world/africa/rss",
        "business": "https://www.reuters.com/business/rss",
    }

    def __init__(self, source_id: int, config: dict):
        super().__init__(source_id, config)
        self.api_key = settings.reuters_api_key
        self.region = config.get("region", "MENA")
        self.topics = config.get("topics", ["TopNews"])
        self.use_api = bool(self.api_key)

    async def fetch_articles(self, since: datetime) -> List[Article]:
        """
        Fetch Reuters articles using API or RSS fallback

        Args:
            since: Fetch articles published after this datetime

        Returns:
            List of Article objects
        """
        if self.use_api:
            return await self._fetch_from_api(since)
        else:
            return await self._fetch_from_rss(since)

    async def _fetch_from_api(self, since: datetime) -> List[Article]:
        """Fetch from Reuters API"""
        try:
            articles = []

            async with httpx.AsyncClient(timeout=30.0) as client:
                for topic in self.topics:
                    try:
                        # Build API request
                        headers = {
                            "Authorization": f"Bearer {self.api_key}",
                            "Accept": "application/json",
                        }

                        # API endpoint (this is a placeholder - adjust based on actual Reuters API)
                        url = f"{self.REUTERS_API_BASE}/articles"
                        params = {
                            "topic": topic,
                            "region": self.region,
                            "since": since.isoformat(),
                            "limit": 50,
                        }

                        response = await client.get(url, headers=headers, params=params)
                        response.raise_for_status()

                        data = response.json()

                        # Process articles (adjust based on actual API response structure)
                        for item in data.get("articles", []):
                            article = self._parse_api_article(item)
                            if article:
                                articles.append(article)

                    except httpx.HTTPError as e:
                        print(f"Error fetching Reuters API for topic {topic}: {e}")
                        continue

            return articles

        except Exception as e:
            print(f"Error with Reuters API, falling back to RSS: {e}")
            return await self._fetch_from_rss(since)

    async def _fetch_from_rss(self, since: datetime) -> List[Article]:
        """Fallback to Reuters RSS feeds"""
        articles = []

        for feed_name, feed_url in self.REUTERS_RSS_URLS.items():
            try:
                # Use RSS ingestor for each feed
                rss_ingestor = RSSIngestor(
                    source_id=self.source_id, config={"url": feed_url}
                )
                feed_articles = await rss_ingestor.fetch_articles(since)
                articles.extend(feed_articles)

            except Exception as e:
                print(f"Error fetching Reuters RSS {feed_name}: {e}")
                continue

        return articles

    def _parse_api_article(self, item: dict) -> Optional[Article]:
        """Parse article from Reuters API response"""
        try:
            # Adjust based on actual API structure
            title = item.get("headline", {}).get("main", "")
            url = item.get("canonical_url", "")

            if not title or not url:
                return None

            # Parse date
            published_str = item.get("published_at", "")
            try:
                from dateutil import parser

                published_at = parser.parse(published_str)
            except Exception:
                published_at = datetime.now(timezone.utc)

            # Extract summary
            summary = item.get("description", "")
            text = item.get("body", "")

            return self._create_article(
                title=title,
                url=url,
                published_at=published_at,
                summary=summary[:1000],
                text=text[:5000],
            )

        except Exception as e:
            print(f"Error parsing Reuters API article: {e}")
            return None
