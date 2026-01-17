"""Tests for article ranker"""

from datetime import datetime, timedelta, timezone

import pytest

from app.models import Article
from app.processors.ranker import ArticleRanker


@pytest.fixture
def ranker():
    return ArticleRanker(half_life_hours=36.0)


def test_recency_score_new_article(ranker):
    """Test recency score for brand new article"""
    now = datetime.now(timezone.utc)
    score = ranker._calculate_recency_score(now, now)
    assert score == 1.0


def test_recency_score_old_article(ranker):
    """Test recency score for old article"""
    now = datetime.now(timezone.utc)
    old_time = now - timedelta(hours=72)  # 72 hours old
    score = ranker._calculate_recency_score(old_time, now)
    assert 0.0 < score < 0.5  # Should be significantly decayed


def test_recency_score_half_life(ranker):
    """Test recency score at half-life"""
    now = datetime.now(timezone.utc)
    half_life_ago = now - timedelta(hours=36)
    score = ranker._calculate_recency_score(half_life_ago, now)
    assert 0.4 < score < 0.6  # Should be around 0.5


def test_keyword_boost(ranker):
    """Test keyword boosting"""
    article = Article(
        title="Egypt IPO listing on stock exchange",
        url="https://example.com/article",
        published_at=datetime.now(timezone.utc),
        summary_raw="Major initial public offering announced",
        content_hash="test",
    )

    score = ranker._calculate_keyword_score(article)
    assert score > 1.0  # Should have boost for "IPO" and "listing"


def test_no_keyword_boost(ranker):
    """Test no keyword boost"""
    article = Article(
        title="Random news story",
        url="https://example.com/article",
        published_at=datetime.now(timezone.utc),
        summary_raw="Some unrelated content",
        content_hash="test",
    )

    score = ranker._calculate_keyword_score(article)
    assert score == 1.0  # No boost


def test_ranking_order(ranker):
    """Test that ranking sorts articles correctly"""
    now = datetime.now(timezone.utc)

    articles = [
        Article(
            id=1,
            title="Old article",
            url="https://example.com/old",
            published_at=now - timedelta(hours=48),
            content_hash="test1",
        ),
        Article(
            id=2,
            title="New article with FX keyword",
            url="https://example.com/new",
            published_at=now - timedelta(hours=1),
            summary_raw="Foreign exchange rates",
            content_hash="test2",
        ),
        Article(
            id=3,
            title="Medium age article",
            url="https://example.com/medium",
            published_at=now - timedelta(hours=24),
            content_hash="test3",
        ),
    ]

    ranked = ranker.rank(articles)

    # Article with keyword + recent should rank highest
    assert ranked[0].id == 2


def test_top_k(ranker):
    """Test top K selection"""
    now = datetime.now(timezone.utc)

    articles = [
        Article(
            id=i,
            title=f"Article {i}",
            url=f"https://example.com/{i}",
            published_at=now - timedelta(hours=i),
            content_hash=f"test{i}",
            score=10 - i,  # Decreasing scores
        )
        for i in range(20)
    ]

    top = ranker.top_k(articles, k=5)
    assert len(top) == 5
    assert all(top[i].score >= top[i + 1].score for i in range(4))
