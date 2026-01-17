"""Base ingestor interface"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import List

from app.models import Article


class BaseIngestor(ABC):
    """Base class for all ingestors"""

    def __init__(self, source_id: int, config: dict):
        self.source_id = source_id
        self.config = config

    @abstractmethod
    async def fetch_articles(self, since: datetime) -> List[Article]:
        """
        Fetch articles published since the given datetime

        Args:
            since: Fetch articles published after this datetime

        Returns:
            List of Article objects
        """
        pass

    def _create_article(
        self,
        title: str,
        url: str,
        published_at: datetime,
        summary: str = None,
        text: str = None,
    ) -> Article:
        """
        Helper to create an Article object

        Args:
            title: Article title
            url: Article URL
            published_at: Publication datetime
            summary: Optional summary/description
            text: Optional full text

        Returns:
            Article object
        """
        return Article(
            source_id=self.source_id,
            title=title,
            url=url,
            published_at=published_at,
            summary_raw=summary,
            text_raw=text,
            content_hash="",  # Will be set during deduplication
        )
