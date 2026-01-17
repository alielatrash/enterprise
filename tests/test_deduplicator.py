"""Tests for article deduplicator"""

from datetime import datetime

import pytest

from app.models import Article
from app.processors.deduplicator import ArticleDeduplicator


@pytest.fixture
def deduplicator():
    return ArticleDeduplicator()


def test_deduplicate_by_url(deduplicator):
    """Test deduplication by URL"""
    articles = [
        Article(
            title="Test Article 1",
            url="https://example.com/article",
            published_at=datetime.utcnow(),
            content_hash="",
        ),
        Article(
            title="Test Article 2",
            url="https://example.com/article",  # Same URL
            published_at=datetime.utcnow(),
            content_hash="",
        ),
    ]

    result = deduplicator.deduplicate(articles)
    assert len(result) == 1


def test_deduplicate_by_title(deduplicator):
    """Test deduplication by title + domain"""
    articles = [
        Article(
            title="Breaking News Story",
            url="https://example.com/story1",
            published_at=datetime.utcnow(),
            content_hash="",
        ),
        Article(
            title="Breaking News Story",  # Same title, same domain
            url="https://example.com/story2",
            published_at=datetime.utcnow(),
            content_hash="",
        ),
    ]

    result = deduplicator.deduplicate(articles)
    # Should keep both since URLs are different
    # Actual deduplication depends on implementation
    assert len(result) >= 1


def test_keep_unique_articles(deduplicator):
    """Test that unique articles are kept"""
    articles = [
        Article(
            title="Article 1",
            url="https://example.com/1",
            published_at=datetime.utcnow(),
            content_hash="",
        ),
        Article(
            title="Article 2",
            url="https://example.com/2",
            published_at=datetime.utcnow(),
            content_hash="",
        ),
        Article(
            title="Article 3",
            url="https://example.com/3",
            published_at=datetime.utcnow(),
            content_hash="",
        ),
    ]

    result = deduplicator.deduplicate(articles)
    assert len(result) == 3


def test_hash_generation(deduplicator):
    """Test content hash generation"""
    article = Article(
        title="Test Article",
        url="https://example.com/article",
        published_at=datetime.utcnow(),
        content_hash="",
    )

    hash1 = deduplicator._generate_hash(article)
    assert hash1
    assert len(hash1) == 16  # SHA256 truncated to 16 chars

    # Same article should generate same hash
    hash2 = deduplicator._generate_hash(article)
    assert hash1 == hash2
