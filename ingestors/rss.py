"""Generic RSS/Atom feed ingestor"""

from datetime import datetime, timezone
from typing import List, Optional
from urllib.parse import urljoin, urlparse

import feedparser
import httpx
from dateutil import parser as date_parser

from app.models import Article

from .base import BaseIngestor


class RSSIngestor(BaseIngestor):
    """Generic RSS/Atom feed ingestor with caching support"""

    def __init__(self, source_id: int, config: dict):
        super().__init__(source_id, config)
        self.feed_url = config.get("url")
        self.etag: Optional[str] = None
        self.last_modified: Optional[str] = None

    async def fetch_articles(self, since: datetime) -> List[Article]:
        """
        Fetch articles from RSS/Atom feed

        Args:
            since: Fetch articles published after this datetime

        Returns:
            List of Article objects
        """
        if not self.feed_url:
            print(f"No feed URL configured for source {self.source_id}")
            return []

        try:
            # Fetch feed with caching headers
            headers = {}
            if self.etag:
                headers["If-None-Match"] = self.etag
            if self.last_modified:
                headers["If-Modified-Since"] = self.last_modified

            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(self.feed_url, headers=headers)

                # Check if not modified
                if response.status_code == 304:
                    return []

                # Update caching headers
                self.etag = response.headers.get("ETag")
                self.last_modified = response.headers.get("Last-Modified")

                # Parse feed
                feed = feedparser.parse(response.text)

                if feed.bozo:  # Feed has errors
                    print(
                        f"Feed parsing error for {self.feed_url}: {feed.get('bozo_exception')}"
                    )

                articles = []

                for entry in feed.entries:
                    try:
                        # Parse publication date
                        published_at = self._parse_date(entry)

                        # Skip if too old
                        if published_at and published_at < since.replace(tzinfo=timezone.utc):
                            continue

                        # Extract URL
                        url = entry.get("link", "")
                        if not url:
                            continue

                        # Make URL absolute
                        url = self._normalize_url(url, self.feed_url)

                        # Extract title
                        title = entry.get("title", "No Title")

                        # Extract summary
                        summary = entry.get("summary", entry.get("description", ""))

                        # Create article
                        article = self._create_article(
                            title=title,
                            url=url,
                            published_at=published_at or datetime.now(timezone.utc),
                            summary=summary[:1000],  # Limit summary size
                            text=entry.get("content", [{}])[0].get("value", "")[:5000]
                            if entry.get("content")
                            else "",
                        )

                        articles.append(article)

                    except Exception as e:
                        print(f"Error processing RSS entry: {e}")
                        continue

                return articles

        except httpx.TimeoutException:
            print(f"Timeout fetching RSS feed: {self.feed_url}")
            return []
        except httpx.HTTPError as e:
            print(f"HTTP error fetching RSS feed {self.feed_url}: {e}")
            return []
        except Exception as e:
            print(f"Error fetching RSS feed {self.feed_url}: {e}")
            return []

    def _parse_date(self, entry: dict) -> Optional[datetime]:
        """Parse publication date from RSS entry"""
        # Try different date fields
        for date_field in ["published", "updated", "created"]:
            date_str = entry.get(f"{date_field}_parsed")
            if date_str:
                try:
                    # feedparser returns time.struct_time
                    from time import mktime

                    timestamp = mktime(date_str)
                    return datetime.fromtimestamp(timestamp, tz=timezone.utc)
                except Exception:
                    pass

            # Try string parsing
            date_str = entry.get(date_field)
            if date_str:
                try:
                    return date_parser.parse(date_str)
                except Exception:
                    pass

        return None

    def _normalize_url(self, url: str, base_url: str) -> str:
        """
        Normalize URL to absolute form

        Args:
            url: Potentially relative URL
            base_url: Base URL of the feed

        Returns:
            Absolute URL
        """
        # If already absolute, return as-is
        parsed = urlparse(url)
        if parsed.scheme and parsed.netloc:
            return url

        # Make absolute using base URL
        return urljoin(base_url, url)
