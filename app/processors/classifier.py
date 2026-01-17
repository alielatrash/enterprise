"""Article classification for regions and sections"""

import re
from typing import List

from app.models import Article, RegionTag, SectionTag


class ArticleClassifier:
    """Classifies articles by region and section"""

    # Region keywords
    REGION_KEYWORDS = {
        RegionTag.EGYPT: [
            "egypt",
            "egyptian",
            "cairo",
            "suez",
            "alexandria",
            "nile",
            "pharaoh",
            "cbe",
            "central bank of egypt",
        ],
        RegionTag.KSA: [
            "saudi",
            "arabia",
            "riyadh",
            "jeddah",
            "mecca",
            "kingdom",
            "ksa",
            "saudi aramco",
            "neom",
        ],
        RegionTag.UAE: [
            "uae",
            "dubai",
            "abu dhabi",
            "emirates",
            "emirati",
            "sharjah",
            "dp world",
        ],
        RegionTag.MENA: [
            "middle east",
            "north africa",
            "mena",
            "gulf",
            "gcc",
            "arab",
            "levant",
        ],
    }

    # Section keywords
    SECTION_KEYWORDS = {
        SectionTag.LOGISTICS_SHIPPING: [
            "shipping",
            "logistics",
            "port",
            "cargo",
            "freight",
            "maritime",
            "vessel",
            "container",
            "suez canal",
            "supply chain",
            "warehouse",
            "transport",
            "delivery",
        ],
        SectionTag.POLICY_REGULATION: [
            "policy",
            "regulation",
            "law",
            "government",
            "ministry",
            "parliament",
            "legislation",
            "compliance",
            "tax",
            "subsidy",
            "reform",
            "central bank",
            "monetary",
            "fiscal",
        ],
    }

    def classify(self, article: Article) -> Article:
        """
        Classify article by region and section

        Args:
            article: Article to classify

        Returns:
            Article with tags set
        """
        # Classify region
        article.region_tag = self._classify_region(article)

        # Classify section
        article.section_tag = self._classify_section(article)

        return article

    def classify_batch(self, articles: List[Article]) -> List[Article]:
        """Classify a batch of articles"""
        return [self.classify(article) for article in articles]

    def _classify_region(self, article: Article) -> str:
        """Classify article region based on keywords"""
        # Combine title and summary for classification
        text = f"{article.title} {article.summary_raw or ''}".lower()

        # Score each region
        scores = {}
        for region, keywords in self.REGION_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword.lower() in text)
            if score > 0:
                scores[region] = score

        # Return region with highest score, or MENA as default
        if scores:
            return max(scores.items(), key=lambda x: x[1])[0].value

        # Default to MENA
        return RegionTag.MENA.value

    def _classify_section(self, article: Article) -> str:
        """Classify article section based on keywords"""
        # Combine title and summary for classification
        text = f"{article.title} {article.summary_raw or ''}".lower()

        # Score each section
        scores = {}
        for section, keywords in self.SECTION_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword.lower() in text)
            if score > 0:
                scores[section] = score

        # Return section with highest score, or GENERAL as default
        if scores:
            return max(scores.items(), key=lambda x: x[1])[0].value

        # Default to GENERAL
        return SectionTag.GENERAL.value
