"""Gmail ingestor for Enterprise Egypt newsletters"""

import base64
import os
import re
from datetime import datetime
from typing import List

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from readability import Document

from app.config import settings
from app.models import Article

from .base import BaseIngestor

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


class GmailIngestor(BaseIngestor):
    """Ingestor for Gmail with specific label"""

    def __init__(self, source_id: int, config: dict):
        super().__init__(source_id, config)
        self.label = config.get("label", settings.gmail_label)
        self.max_results = config.get("max_results", 50)
        self.service = None

    def _get_credentials(self) -> Credentials:
        """Get or refresh Gmail API credentials"""
        creds = None

        # Token file stores the user's access and refresh tokens
        if os.path.exists(settings.gmail_token_path):
            creds = Credentials.from_authorized_user_file(settings.gmail_token_path, SCOPES)

        # If there are no (valid) credentials available, let the user log in
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(settings.gmail_credentials_path):
                    raise FileNotFoundError(
                        f"Gmail credentials file not found at {settings.gmail_credentials_path}"
                    )
                flow = InstalledAppFlow.from_client_secrets_file(
                    settings.gmail_credentials_path, SCOPES
                )
                creds = flow.run_local_server(port=0)

            # Save the credentials for the next run
            with open(settings.gmail_token_path, "w") as token:
                token.write(creds.to_json())

        return creds

    async def fetch_articles(self, since: datetime) -> List[Article]:
        """
        Fetch emails from Gmail with specified label

        Args:
            since: Fetch emails after this datetime

        Returns:
            List of Article objects
        """
        try:
            # Initialize Gmail service
            if not self.service:
                creds = self._get_credentials()
                self.service = build("gmail", "v1", credentials=creds)

            # Convert datetime to Gmail query format
            after_date = since.strftime("%Y/%m/%d")
            query = f"label:{self.label} after:{after_date}"

            # Get messages
            results = (
                self.service.users()
                .messages()
                .list(userId="me", q=query, maxResults=self.max_results)
                .execute()
            )

            messages = results.get("messages", [])
            articles = []

            for msg in messages:
                try:
                    article = await self._process_message(msg["id"])
                    if article:
                        articles.append(article)
                except Exception as e:
                    print(f"Error processing message {msg['id']}: {e}")
                    continue

            return articles

        except FileNotFoundError as e:
            print(f"Gmail credentials not found: {e}")
            return []
        except Exception as e:
            print(f"Error fetching from Gmail: {e}")
            return []

    async def _process_message(self, message_id: str) -> Article:
        """Process a single Gmail message"""
        msg = (
            self.service.users()
            .messages()
            .get(userId="me", id=message_id, format="full")
            .execute()
        )

        # Extract headers
        headers = {h["name"]: h["value"] for h in msg["payload"]["headers"]}
        subject = headers.get("Subject", "No Subject")
        date_str = headers.get("Date", "")

        # Parse date
        from email.utils import parsedate_to_datetime

        try:
            published_at = parsedate_to_datetime(date_str)
        except Exception:
            published_at = datetime.utcnow()

        # Extract body
        body_html = self._get_message_body(msg["payload"])

        if not body_html:
            return None

        # Use readability to extract main content and links
        doc = Document(body_html)
        title = doc.title() or subject
        summary = doc.summary()

        # Extract links from content
        links = self._extract_links(summary)

        # For newsletters, we might want to extract multiple articles
        # For now, we'll create one article per email with the main link
        main_url = links[0] if links else f"gmail:{message_id}"

        article = self._create_article(
            title=title,
            url=main_url,
            published_at=published_at,
            summary=doc.short_title(),
            text=summary[:5000],  # Limit text size
        )

        return article

    def _get_message_body(self, payload: dict) -> str:
        """Extract HTML body from Gmail message payload"""
        if "parts" in payload:
            for part in payload["parts"]:
                if part["mimeType"] == "text/html":
                    data = part["body"].get("data", "")
                    if data:
                        return base64.urlsafe_b64decode(data).decode("utf-8")
                elif "parts" in part:
                    # Recursive for nested parts
                    result = self._get_message_body(part)
                    if result:
                        return result
        else:
            if payload.get("mimeType") == "text/html":
                data = payload["body"].get("data", "")
                if data:
                    return base64.urlsafe_b64decode(data).decode("utf-8")

        return ""

    def _extract_links(self, html: str) -> List[str]:
        """Extract URLs from HTML content"""
        import re

        url_pattern = r'href=["\'](https?://[^\s"\']+)["\']'
        urls = re.findall(url_pattern, html)
        # Filter out common tracking/unsubscribe links
        urls = [
            url
            for url in urls
            if not any(
                x in url.lower()
                for x in ["unsubscribe", "pixel", "track", "beacon", "analytics"]
            )
        ]
        return urls[:10]  # Limit to first 10 links
