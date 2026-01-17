"""Tests for article classifier"""

from datetime import datetime

import pytest

from app.models import Article, RegionTag, SectionTag
from app.processors.classifier import ArticleClassifier


@pytest.fixture
def classifier():
    return ArticleClassifier()


def test_classify_egypt(classifier):
    """Test Egypt classification"""
    article = Article(
        title="Egypt's Central Bank raises interest rates",
        url="https://example.com/article",
        published_at=datetime.utcnow(),
        summary_raw="The Central Bank of Egypt announced new monetary policy",
        content_hash="test",
    )

    result = classifier.classify(article)
    assert result.region_tag == RegionTag.EGYPT.value


def test_classify_ksa(classifier):
    """Test KSA classification"""
    article = Article(
        title="Saudi Arabia launches NEOM project expansion",
        url="https://example.com/article",
        published_at=datetime.utcnow(),
        summary_raw="Saudi Aramco invests in new infrastructure in Riyadh",
        content_hash="test",
    )

    result = classifier.classify(article)
    assert result.region_tag == RegionTag.KSA.value


def test_classify_uae(classifier):
    """Test UAE classification"""
    article = Article(
        title="Dubai launches new logistics hub",
        url="https://example.com/article",
        published_at=datetime.utcnow(),
        summary_raw="DP World expands operations in Abu Dhabi",
        content_hash="test",
    )

    result = classifier.classify(article)
    assert result.region_tag == RegionTag.UAE.value


def test_classify_logistics(classifier):
    """Test logistics section classification"""
    article = Article(
        title="Suez Canal sees record cargo volumes",
        url="https://example.com/article",
        published_at=datetime.utcnow(),
        summary_raw="Shipping traffic through the canal increased with new container vessels",
        content_hash="test",
    )

    result = classifier.classify(article)
    assert result.section_tag == SectionTag.LOGISTICS_SHIPPING.value


def test_classify_policy(classifier):
    """Test policy section classification"""
    article = Article(
        title="New tax reform legislation passed",
        url="https://example.com/article",
        published_at=datetime.utcnow(),
        summary_raw="Government introduces fiscal policy changes and new regulations",
        content_hash="test",
    )

    result = classifier.classify(article)
    assert result.section_tag == SectionTag.POLICY_REGULATION.value


def test_classify_general_default(classifier):
    """Test general classification as default"""
    article = Article(
        title="Tech startup raises funding",
        url="https://example.com/article",
        published_at=datetime.utcnow(),
        summary_raw="A new technology company secured investment",
        content_hash="test",
    )

    result = classifier.classify(article)
    assert result.section_tag == SectionTag.GENERAL.value
