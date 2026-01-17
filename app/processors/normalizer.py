"""Article normalization"""

import re
from typing import List
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from app.models import Article


class ArticleNormalizer:
    """Normalizes article data"""

    def __init__(self):
        self.timeout = 10.0

    async def normalize(self, article: Article) -> Article:
        """
        Normalize article data

        Args:
            article: Article to normalize

        Returns:
            Normalized article
        """
        # Clean title
        article.title = self._clean_title(article.title)

        # Normalize URL
        article.url = await self._normalize_url(article.url)

        # Clean summary
        if article.summary_raw:
            article.summary_raw = self._clean_text(article.summary_raw)

        # Clean text
        if article.text_raw:
            article.text_raw = self._clean_text(article.text_raw)

        return article

    async def normalize_batch(self, articles: List[Article]) -> List[Article]:
        """Normalize a batch of articles"""
        normalized = []
        for article in articles:
            try:
                normalized_article = await self.normalize(article)
                normalized.append(normalized_article)
            except Exception as e:
                print(f"Error normalizing article '{article.title}': {e}")
                # Include original article even if normalization fails
                normalized.append(article)
        return normalized

    def _clean_title(self, title: str) -> str:
        """Clean and normalize title"""
        if not title:
            return "Untitled"

        # Remove HTML tags
        title = re.sub(r"<[^>]+>", "", title)

        # Remove extra whitespace
        title = re.sub(r"\s+", " ", title).strip()

        # Remove common prefixes/suffixes
        patterns = [
            r"^(BREAKING|UPDATE|EXCLUSIVE|URGENT):\s*",
            r"\s*-\s*[A-Z\s]+$",  # Remove " - SITENAME" suffixes
        ]
        for pattern in patterns:
            title = re.sub(pattern, "", title, flags=re.IGNORECASE)

        return title.strip()

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""

        # Parse HTML if present
        soup = BeautifulSoup(text, "html.parser")
        text = soup.get_text()

        # Remove extra whitespace
        text = re.sub(r"\s+", " ", text).strip()

        return text

    async def _normalize_url(self, url: str) -> str:
        """
        Normalize URL to canonical form

        Args:
            url: Original URL

        Returns:
            Canonical URL
        """
        if not url:
            return ""

        # Parse URL
        parsed = urlparse(url)

        # If it's a gmail: pseudo-URL, return as-is
        if parsed.scheme == "gmail":
            return url

        # Remove tracking parameters
        if parsed.query:
            # Common tracking parameters to remove
            tracking_params = {
                "utm_source",
                "utm_medium",
                "utm_campaign",
                "utm_term",
                "utm_content",
                "fbclid",
                "gclid",
                "ref",
                "source",
            }

            # Parse query string
            from urllib.parse import parse_qs, urlencode

            params = parse_qs(parsed.query)
            # Filter out tracking params
            clean_params = {k: v for k, v in params.items() if k not in tracking_params}

            # Rebuild URL
            from urllib.parse import urlunparse

            parsed = parsed._replace(query=urlencode(clean_params, doseq=True))
            url = urlunparse(parsed)

        # Try to fetch canonical URL from page (with timeout)
        try:
            canonical = await self._fetch_canonical_url(url)
            if canonical:
                return canonical
        except Exception:
            pass  # If we can't fetch canonical, use cleaned URL

        return url

    async def _fetch_canonical_url(self, url: str) -> str:
        """
        Fetch canonical URL from page's <link rel="canonical">

        Args:
            url: URL to check

        Returns:
            Canonical URL if found, empty string otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.head(url)

                # If HEAD fails, try GET but limit size
                if response.status_code >= 400:
                    response = await client.get(url, timeout=self.timeout)

                # Check for canonical redirect
                final_url = str(response.url)

                # Try to parse HTML for canonical link (only if HTML)
                content_type = response.headers.get("content-type", "")
                if "text/html" in content_type:
                    # Fetch just the head section
                    response = await client.get(url, timeout=self.timeout)
                    html = response.text[:10000]  # First 10KB should contain <head>

                    soup = BeautifulSoup(html, "html.parser")
                    canonical_link = soup.find("link", {"rel": "canonical"})

                    if canonical_link and canonical_link.get("href"):
                        canonical = canonical_link["href"]
                        # Make absolute if relative
                        if not urlparse(canonical).netloc:
                            canonical = urljoin(url, canonical)
                        return canonical

                return final_url

        except httpx.TimeoutException:
            return ""
        except Exception as e:
            print(f"Error fetching canonical URL for {url}: {e}")
            return ""
