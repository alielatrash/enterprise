"""LLM-based article summarization"""

import json
from datetime import datetime
from typing import List, Optional

from app.config import settings
from app.models import Article


class ArticleSummarizer:
    """Summarizes articles using LLM (Claude or OpenAI)"""

    def __init__(self):
        self.use_anthropic = bool(settings.anthropic_api_key)
        self.use_openai = bool(settings.openai_api_key)

        # Initialize clients lazily
        self._anthropic_client = None
        self._openai_client = None

    @property
    def anthropic_client(self):
        """Lazy load Anthropic client"""
        if self._anthropic_client is None and self.use_anthropic:
            from anthropic import Anthropic

            self._anthropic_client = Anthropic(api_key=settings.anthropic_api_key)
        return self._anthropic_client

    @property
    def openai_client(self):
        """Lazy load OpenAI client"""
        if self._openai_client is None and self.use_openai:
            from openai import OpenAI

            self._openai_client = OpenAI(api_key=settings.openai_api_key)
        return self._openai_client

    async def summarize(self, articles: List[Article], date: str) -> dict:
        """
        Generate summary from articles

        Args:
            articles: List of ranked articles
            date: Date string (YYYY-MM-DD) for the digest

        Returns:
            Dict with 'tl_dr' and 'sections' keys
        """
        if not articles:
            return {
                "tl_dr": "No major updates today.",
                "sections": {},
            }

        # Try LLM summarization first
        if self.use_anthropic or self.use_openai:
            try:
                return await self._llm_summarize(articles, date)
            except Exception as e:
                print(f"LLM summarization failed: {e}, falling back to extractive")

        # Fallback to extractive summarization
        return self._extractive_summarize(articles)

    async def _llm_summarize(self, articles: List[Article], date: str) -> dict:
        """Use LLM (Claude or OpenAI) to generate summary"""

        # Prepare articles data
        articles_data = []
        for article in articles:
            articles_data.append(
                {
                    "title": article.title,
                    "url": article.url,
                    "summary": article.summary_raw or "",
                    "region": article.region_tag,
                    "section": article.section_tag,
                    "published_at": article.published_at.isoformat(),
                }
            )

        # Build prompt
        system_prompt = (
            "You summarize news for a busy operator in MENA logistics/tech. "
            "Be concise, factual, and neutral. Always attach the best link per bullet."
        )

        user_prompt = f"""Summarize these articles into:
1) TL;DR (3-4 sentences max).
2) Bullets grouped by sections: EGYPT, KSA, UAE, LOGISTICS/SHIPPING, POLICY/REGULATION.
3) Each bullet: one line, start with a short headline, then a single link in parentheses.

Date: {date} (Africa/Cairo)
Articles (JSON):
{json.dumps(articles_data, indent=2)}

Notes: Prefer Reuters and Enterprise links when duplicates exist. Avoid clickbait.

Respond in JSON format:
{{
  "tl_dr": "Your 3-4 sentence summary here",
  "sections": {{
    "EGYPT": ["bullet with (link)", ...],
    "KSA": ["bullet with (link)", ...],
    "UAE": ["bullet with (link)", ...],
    "LOGISTICS_SHIPPING": ["bullet with (link)", ...],
    "POLICY_REGULATION": ["bullet with (link)", ...]
  }}
}}

Only include sections that have content. Each bullet must include a link in parentheses.
"""

        # Try Anthropic first
        if self.use_anthropic:
            try:
                response = self.anthropic_client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=2000,
                    temperature=0.3,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_prompt}],
                )

                # Parse response
                content = response.content[0].text

                # Extract JSON from response (handle markdown code blocks)
                import re

                json_match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
                if json_match:
                    content = json_match.group(1)
                elif "```" in content:
                    # Try to extract content between any code blocks
                    content = re.sub(r"```[a-z]*\s*", "", content)
                    content = re.sub(r"```", "", content)

                return json.loads(content.strip())

            except Exception as e:
                print(f"Anthropic summarization failed: {e}")
                if not self.use_openai:
                    raise

        # Try OpenAI as fallback
        if self.use_openai:
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )

            content = response.choices[0].message.content
            return json.loads(content)

        raise Exception("No LLM provider available")

    def _extractive_summarize(self, articles: List[Article]) -> dict:
        """
        Fallback extractive summarization

        Args:
            articles: List of articles

        Returns:
            Summary dict
        """
        # Group by section
        sections = {}

        for article in articles[:10]:  # Top 10
            section = article.section_tag

            if section not in sections:
                sections[section] = []

            # Create bullet: first sentence + link
            summary = article.summary_raw or article.title
            first_sentence = summary.split(".")[0] + "."

            bullet = f"{article.title} ({article.url})"
            sections[section].append(bullet)

        # Create TL;DR from top 3 articles
        top_titles = [a.title for a in articles[:3]]
        tl_dr = (
            f"Today's top stories: {', '.join(top_titles[:2])}"
            + (f", and {top_titles[2]}" if len(top_titles) > 2 else "")
            + "."
        )

        return {
            "tl_dr": tl_dr,
            "sections": sections,
        }
