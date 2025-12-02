
from .settings import settings as app_settings
from .models import SettingsPublic, TelemetryMessage
import smtplib
from email.message import EmailMessage
import asyncio

async def send_trade_notification(user_settings: SettingsPublic, msg: TelemetryMessage):
    tasks = []
    if user_settings.notify_email and app_settings.SMTP_HOST:
        tasks.append(asyncio.create_task(_send_email(user_settings.notify_email, msg)))
    if user_settings.notify_sms_number and app_settings.SMS_PROVIDER:
        print(f"[Pluto] SMS to {user_settings.notify_sms_number}: {msg.json()}")
    if tasks:
        await asyncio.gather(*tasks)

async def _send_email(to_addr: str, msg: TelemetryMessage):
    try:
        em = EmailMessage()
        em["From"] = app_settings.SMTP_FROM or app_settings.SMTP_USER
        em["To"] = to_addr
        em["Subject"] = f"Pluto Launcher trade signal: {msg.symbol} {msg.side}"
        body = f"""New trade signal:

Symbol: {msg.symbol}
Side: {msg.side}
Confidence: {msg.confidence}
Reason: {msg.reason}
Price: {msg.price}
"""
        em.set_content(body)

        with smtplib.SMTP(app_settings.SMTP_HOST, app_settings.SMTP_PORT) as s:
            s.starttls()
            if app_settings.SMTP_USER and app_settings.SMTP_PASSWORD:
                s.login(app_settings.SMTP_USER, app_settings.SMTP_PASSWORD)
            s.send_message(em)
        print(f"[Pluto] Email notification sent to {to_addr}")
    except Exception as e:
        print(f"[Pluto] Email send failed: {e}")
