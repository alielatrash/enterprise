"""Delivery services for digest"""

from .email import EmailDelivery
from .telegram import TelegramDelivery
from .whatsapp import WhatsAppDelivery

__all__ = ["EmailDelivery", "WhatsAppDelivery", "TelegramDelivery"]
