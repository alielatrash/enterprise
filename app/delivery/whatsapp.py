"""WhatsApp delivery via Twilio"""

from typing import Optional

from app.config import settings


class WhatsAppDelivery:
    """WhatsApp delivery service via Twilio"""

    def __init__(self):
        self.enabled = bool(
            settings.twilio_account_sid
            and settings.twilio_auth_token
            and settings.twilio_whatsapp_to
        )

    async def send(self, message: str, to_number: Optional[str] = None) -> bool:
        """
        Send WhatsApp message

        Args:
            message: Message text
            to_number: Recipient number (defaults to config)

        Returns:
            True if sent successfully
        """
        if not self.enabled:
            print("WhatsApp delivery not configured")
            return False

        try:
            from twilio.rest import Client

            client = Client(settings.twilio_account_sid, settings.twilio_auth_token)

            to_number = to_number or settings.twilio_whatsapp_to

            message = client.messages.create(
                body=message,
                from_=settings.twilio_whatsapp_from,
                to=to_number,
            )

            print(f"✓ WhatsApp sent: {message.sid}")
            return True

        except Exception as e:
            print(f"WhatsApp delivery error: {e}")
            return False

    async def send_digest_summary(self, date: str, tl_dr: str, top_links: list) -> bool:
        """
        Send digest summary via WhatsApp

        Args:
            date: Date string
            tl_dr: TL;DR summary
            top_links: List of top article dicts with 'title' and 'url'

        Returns:
            True if sent successfully
        """
        # Format message (WhatsApp has character limits)
        message = f"*MENA Daily TL;DR — {date}*\n\n"
        message += f"{tl_dr}\n\n"
        message += "*Top Stories:*\n"

        for i, link in enumerate(top_links[:5], 1):
            message += f"{i}. {link['title']}\n{link['url']}\n\n"

        return await self.send(message)
