"""Article deduplication"""

import hashlib
from typing import List
from urllib.parse import urlparse

from app.models import Article


class ArticleDeduplicator:
    """Deduplicates articles based on URL and content similarity"""

    def deduplicate(self, articles: List[Article]) -> List[Article]:
        """
        Remove duplicate articles

        Args:
            articles: List of articles to deduplicate

        Returns:
            Deduplicated list of articles
        """
        seen_hashes = set()
        unique_articles = []

        for article in articles:
            # Generate content hash
            content_hash = self._generate_hash(article)
            article.content_hash = content_hash

            # Skip if we've seen this hash
            if content_hash in seen_hashes:
                continue

            seen_hashes.add(content_hash)
            unique_articles.append(article)

        return unique_articles

    def _generate_hash(self, article: Article) -> str:
        """
        Generate content hash for deduplication

        Args:
            article: Article to hash

        Returns:
            Content hash string
        """
        # Try to use canonical URL first
        if article.url and not article.url.startswith("gmail:"):
            url_hash = self._hash_url(article.url)
            return url_hash

        # Fallback to title + domain hash
        # Extract domain from URL
        domain = self._extract_domain(article.url)
        title_normalized = self._normalize_title(article.title)

        combined = f"{domain}:{title_normalized}"
        return hashlib.sha256(combined.encode("utf-8")).hexdigest()[:16]

    def _hash_url(self, url: str) -> str:
        """Hash URL for deduplication"""
        # Normalize URL for hashing
        parsed = urlparse(url)

        # Create normalized form: scheme://domain/path (ignore query, fragment)
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

        # Remove trailing slashes
        normalized = normalized.rstrip("/")

        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]

    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        if not url:
            return "unknown"

        try:
            parsed = urlparse(url)
            return parsed.netloc or "unknown"
        except Exception:
            return "unknown"

    def _normalize_title(self, title: str) -> str:
        """
        Normalize title for similarity comparison

        Args:
            title: Original title

        Returns:
            Normalized title
        """
        if not title:
            return ""

        # Convert to lowercase
        title = title.lower()

        # Remove punctuation
        import string

        title = title.translate(str.maketrans("", "", string.punctuation))

        # Remove extra whitespace
        import re

        title = re.sub(r"\s+", " ", title).strip()

        return title
