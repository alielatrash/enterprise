"""Database models"""

import json
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class SourceType(str, Enum):
    """Source type enumeration"""

    GMAIL = "gmail"
    RSS = "rss"
    REUTERS_API = "reuters_api"


class RegionTag(str, Enum):
    """Region tag enumeration"""

    EGYPT = "EGYPT"
    KSA = "KSA"
    UAE = "UAE"
    MENA = "MENA"
    OTHER = "OTHER"


class SectionTag(str, Enum):
    """Section tag enumeration"""

    LOGISTICS_SHIPPING = "LOGISTICS_SHIPPING"
    POLICY_REGULATION = "POLICY_REGULATION"
    GENERAL = "GENERAL"


class Source(SQLModel, table=True):
    """News source configuration"""

    __tablename__ = "sources"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    type: str = Field(index=True)  # SourceType
    config_json: str = Field(default="{}")  # JSON string
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def config(self) -> dict:
        """Get config as dictionary"""
        return json.loads(self.config_json)

    @config.setter
    def config(self, value: dict):
        """Set config from dictionary"""
        self.config_json = json.dumps(value)


class Article(SQLModel, table=True):
    """News article"""

    __tablename__ = "articles"

    id: Optional[int] = Field(default=None, primary_key=True)
    source_id: Optional[int] = Field(default=None, foreign_key="sources.id", index=True)
    title: str = Field(index=True)
    url: str = Field(index=True)
    published_at: datetime = Field(index=True)
    summary_raw: Optional[str] = None
    text_raw: Optional[str] = None
    region_tag: str = Field(default=RegionTag.MENA.value, index=True)
    section_tag: str = Field(default=SectionTag.GENERAL.value, index=True)
    content_hash: str = Field(index=True)  # For deduplication
    score: float = Field(default=0.0, index=True)  # Ranking score
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        """Convert to dictionary for serialization"""
        return {
            "id": self.id,
            "source_id": self.source_id,
            "title": self.title,
            "url": self.url,
            "published_at": self.published_at.isoformat(),
            "summary_raw": self.summary_raw,
            "text_raw": self.text_raw,
            "region_tag": self.region_tag,
            "section_tag": self.section_tag,
            "score": self.score,
        }


class Digest(SQLModel, table=True):
    """Daily digest"""

    __tablename__ = "digests"

    id: Optional[int] = Field(default=None, primary_key=True)
    date: str = Field(index=True)  # YYYY-MM-DD in Africa/Cairo timezone
    tl_dr: Optional[str] = None
    items_json: str = Field(default="[]")  # JSON array of article IDs and metadata
    html_path: Optional[str] = None
    md_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    delivered_at: Optional[datetime] = None

    @property
    def items(self) -> list:
        """Get items as list"""
        return json.loads(self.items_json)

    @items.setter
    def items(self, value: list):
        """Set items from list"""
        self.items_json = json.dumps(value)
