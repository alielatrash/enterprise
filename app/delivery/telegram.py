"""Telegram delivery"""

from typing import Optional

from app.config import settings


class TelegramDelivery:
    """Telegram delivery service"""

    def __init__(self):
        self.enabled = bool(settings.telegram_bot_token and settings.telegram_chat_id)

    async def send(self, message: str, chat_id: Optional[str] = None) -> bool:
        """
        Send Telegram message

        Args:
            message: Message text (supports Markdown)
            chat_id: Chat ID (defaults to config)

        Returns:
            True if sent successfully
        """
        if not self.enabled:
            print("Telegram delivery not configured")
            return False

        try:
            from telegram import Bot

            bot = Bot(token=settings.telegram_bot_token)
            chat_id = chat_id or settings.telegram_chat_id

            # Send message with Markdown formatting
            await bot.send_message(
                chat_id=chat_id,
                text=message,
                parse_mode="Markdown",
                disable_web_page_preview=False,
            )

            print(f"✓ Telegram message sent to {chat_id}")
            return True

        except Exception as e:
            print(f"Telegram delivery error: {e}")
            return False

    async def send_digest_summary(self, date: str, tl_dr: str, top_links: list) -> bool:
        """
        Send digest summary via Telegram

        Args:
            date: Date string
            tl_dr: TL;DR summary
            top_links: List of top article dicts with 'title' and 'url'

        Returns:
            True if sent successfully
        """
        # Format message with Markdown
        message = f"*MENA Daily TL;DR — {date}*\n\n"
        message += f"{tl_dr}\n\n"
        message += "*Top Stories:*\n"

        for i, link in enumerate(top_links[:5], 1):
            # Telegram Markdown link format: [text](url)
            message += f"{i}. [{link['title']}]({link['url']})\n"

        return await self.send(message)
