"""Article ranking algorithm"""

import math
from datetime import datetime, timezone
from typing import List

from app.models import Article


class ArticleRanker:
    """Ranks articles based on multiple factors"""

    # Source weights (higher = more important)
    SOURCE_WEIGHTS = {
        "reuters": 2.0,
        "enterprise": 1.8,
        "gmail": 1.5,  # Enterprise via Gmail
        "rss": 1.0,
    }

    # Keyword boosts
    KEYWORD_BOOSTS = {
        "fx": 1.5,
        "foreign exchange": 1.5,
        "currency": 1.3,
        "budget": 1.4,
        "shipping": 1.3,
        "port": 1.3,
        "logistics": 1.2,
        "suez": 1.4,
        "oil": 1.3,
        "gas": 1.2,
        "ipo": 1.5,
        "listing": 1.4,
        "investment": 1.2,
        "merger": 1.4,
        "acquisition": 1.4,
        "policy": 1.2,
        "regulation": 1.2,
        "central bank": 1.5,
        "interest rate": 1.4,
    }

    def __init__(self, half_life_hours: float = 36.0):
        """
        Initialize ranker

        Args:
            half_life_hours: Half-life for recency scoring (hours)
        """
        self.half_life_hours = half_life_hours

    def rank(self, articles: List[Article], source_map: dict = None) -> List[Article]:
        """
        Rank articles and set their scores

        Args:
            articles: List of articles to rank
            source_map: Dict mapping source_id to source info (for weights)

        Returns:
            Articles with scores set, sorted by score (highest first)
        """
        now = datetime.now(timezone.utc)

        for article in articles:
            # Calculate components
            recency_score = self._calculate_recency_score(article.published_at, now)
            source_score = self._calculate_source_score(article, source_map)
            keyword_score = self._calculate_keyword_score(article)

            # Combined score
            article.score = recency_score * source_score * keyword_score

        # Sort by score descending
        articles.sort(key=lambda a: a.score, reverse=True)

        return articles

    def _calculate_recency_score(self, published_at: datetime, now: datetime) -> float:
        """
        Calculate recency score using exponential decay

        Args:
            published_at: Publication datetime
            now: Current datetime

        Returns:
            Recency score (0-1)
        """
        # Ensure timezone-aware
        if published_at.tzinfo is None:
            published_at = published_at.replace(tzinfo=timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        # Calculate age in hours
        age_hours = (now - published_at).total_seconds() / 3600

        # Exponential decay: score = 2^(-age/half_life)
        score = math.pow(2, -age_hours / self.half_life_hours)

        return max(0.0, min(1.0, score))  # Clamp to [0, 1]

    def _calculate_source_score(self, article: Article, source_map: dict = None) -> float:
        """
        Calculate source weight

        Args:
            article: Article
            source_map: Dict mapping source_id to source info

        Returns:
            Source weight multiplier
        """
        if not source_map or article.source_id not in source_map:
            return 1.0

        source_info = source_map[article.source_id]
        source_type = source_info.get("type", "rss")

        # Get base weight from source type
        for key, weight in self.SOURCE_WEIGHTS.items():
            if key in source_type.lower():
                return weight

        return 1.0

    def _calculate_keyword_score(self, article: Article) -> float:
        """
        Calculate keyword boost score

        Args:
            article: Article

        Returns:
            Keyword boost multiplier
        """
        text = f"{article.title} {article.summary_raw or ''}".lower()

        # Find all matching keywords and apply highest boost
        boosts = [
            boost for keyword, boost in self.KEYWORD_BOOSTS.items() if keyword.lower() in text
        ]

        if not boosts:
            return 1.0

        # Use maximum boost (not cumulative to avoid over-boosting)
        return max(boosts)

    def top_k(self, articles: List[Article], k: int = 10) -> List[Article]:
        """
        Get top K articles

        Args:
            articles: Ranked articles
            k: Number of top articles to return

        Returns:
            Top K articles
        """
        return articles[:k]
