"""News ingestors for various sources"""

from .base import BaseIngestor
from .gmail_enterprise import GmailIngestor
from .reuters import ReutersIngestor
from .rss import RSSIngestor

__all__ = ["BaseIngestor", "GmailIngestor", "RSSIngestor", "ReutersIngestor"]
