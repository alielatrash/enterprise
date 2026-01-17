"""Scheduler for daily digest generation"""

import asyncio

import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.pipeline import DigestPipeline


class DigestScheduler:
    """Scheduler for daily digest generation"""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.pipeline = DigestPipeline()
        self.timezone = pytz.timezone(settings.tz)

    def start(self):
        """Start the scheduler"""
        # Schedule daily digest at configured time
        trigger = CronTrigger(
            hour=settings.digest_schedule_hour,
            minute=settings.digest_schedule_minute,
            timezone=self.timezone,
        )

        self.scheduler.add_job(
            self._run_digest,
            trigger=trigger,
            id="daily_digest",
            name="Daily MENA Digest",
            replace_existing=True,
        )

        self.scheduler.start()
        print(
            f"✓ Scheduler started - digest will run daily at "
            f"{settings.digest_schedule_hour:02d}:{settings.digest_schedule_minute:02d} {settings.tz}"
        )

    def stop(self):
        """Stop the scheduler"""
        self.scheduler.shutdown()
        print("✓ Scheduler stopped")

    async def _run_digest(self):
        """Run the digest pipeline (scheduled task)"""
        print("\n[SCHEDULED] Running daily digest...")
        try:
            await self.pipeline.run()
        except Exception as e:
            print(f"[SCHEDULED] Error running digest: {e}")
            import traceback

            traceback.print_exc()

    async def run_now(self):
        """Run digest immediately (for manual triggers)"""
        return await self.pipeline.run()
