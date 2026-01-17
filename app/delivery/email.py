"""Email delivery via SendGrid or SMTP"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional

from app.config import settings


class EmailDelivery:
    """Email delivery service"""

    def __init__(self):
        self.use_sendgrid = bool(settings.sendgrid_api_key)

    async def send(
        self,
        subject: str,
        html_content: str,
        text_content: str,
        to_email: Optional[str] = None,
    ) -> bool:
        """
        Send digest email

        Args:
            subject: Email subject
            html_content: HTML content
            text_content: Plain text content
            to_email: Recipient email (defaults to config)

        Returns:
            True if sent successfully
        """
        to_email = to_email or settings.digest_email_to

        if not to_email:
            print("No recipient email configured")
            return False

        if self.use_sendgrid:
            return await self._send_via_sendgrid(subject, html_content, text_content, to_email)
        else:
            return await self._send_via_smtp(subject, html_content, text_content, to_email)

    async def _send_via_sendgrid(
        self, subject: str, html_content: str, text_content: str, to_email: str
    ) -> bool:
        """Send email via SendGrid"""
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            message = Mail(
                from_email=settings.smtp_from or "noreply@mena-digest.com",
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=text_content,
            )

            sg = SendGridAPIClient(settings.sendgrid_api_key)
            response = sg.send(message)

            if response.status_code in [200, 201, 202]:
                print(f"✓ Email sent via SendGrid to {to_email}")
                return True
            else:
                print(f"SendGrid error: {response.status_code} - {response.body}")
                return False

        except Exception as e:
            print(f"SendGrid error: {e}")
            # Try SMTP fallback
            return await self._send_via_smtp(subject, html_content, text_content, to_email)

    async def _send_via_smtp(
        self, subject: str, html_content: str, text_content: str, to_email: str
    ) -> bool:
        """Send email via SMTP"""
        try:
            if not settings.smtp_user or not settings.smtp_password:
                print("SMTP credentials not configured")
                return False

            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.smtp_from or settings.smtp_user
            msg["To"] = to_email

            # Attach both plain text and HTML
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")

            msg.attach(part1)
            msg.attach(part2)

            # Send via SMTP
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(msg)

            print(f"✓ Email sent via SMTP to {to_email}")
            return True

        except Exception as e:
            print(f"SMTP error: {e}")
            return False

    async def send_digest(self, date: str, html_path: str, md_path: str) -> bool:
        """
        Send digest email

        Args:
            date: Date string (YYYY-MM-DD)
            html_path: Path to HTML file
            md_path: Path to Markdown file

        Returns:
            True if sent successfully
        """
        # Read files
        html_content = Path(html_path).read_text(encoding="utf-8")
        text_content = Path(md_path).read_text(encoding="utf-8")

        # Subject
        subject = f"MENA Daily TL;DR — {date}"

        return await self.send(subject, html_content, text_content)
