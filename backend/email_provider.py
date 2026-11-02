"""Email delivery for verification and password reset.

Phase 2B requirements:
- Production-ready provider abstraction
- Environment-based configuration
- Safe fallback when unconfigured
- Never falsely claim delivery succeeded
- Never mark accounts verified due to delivery failure
"""

import os
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class EmailMessage:
    """Email message to send."""
    to: str
    subject: str
    text_body: str
    html_body: str | None = None


class EmailProvider(ABC):
    """Abstract email provider."""

    @abstractmethod
    def send(self, message: EmailMessage) -> bool:
        """Send an email message.

        Returns:
            True if sent successfully, False otherwise.

        Never raises - provider errors are caught and returned as False.
        """
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if provider is properly configured."""
        pass


class ConsoleEmailProvider(EmailProvider):
    """Development provider that prints emails to console.

    ONLY for development/testing. Never use in production.
    """

    def send(self, message: EmailMessage) -> bool:
        print(f"\n{'='*60}")
        print(f"📧 EMAIL (console-only, not sent)")
        print(f"{'='*60}")
        print(f"To: {message.to}")
        print(f"Subject: {message.subject}")
        print(f"\n{message.text_body}")
        if message.html_body:
            print(f"\nHTML: {message.html_body[:200]}...")
        print(f"{'='*60}\n")
        return True

    def is_configured(self) -> bool:
        return True


class SendGridEmailProvider(EmailProvider):
    """SendGrid email provider (production-ready)."""

    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@riva.ai")

    def send(self, message: EmailMessage) -> bool:
        if not self.is_configured():
            return False

        try:
            # Import sendgrid only when actually configured
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            mail = Mail(
                from_email=self.from_email,
                to_emails=message.to,
                subject=message.subject,
                plain_text_content=message.text_body,
                html_content=message.html_body,
            )

            sg = SendGridAPIClient(self.api_key)
            response = sg.send(mail)
            return response.status_code in (200, 201, 202)
        except Exception as e:
            # Log but don't crash - email failure is not a server error
            print(f"SendGrid delivery failed: {e}")
            return False

    def is_configured(self) -> bool:
        return bool(self.api_key and self.from_email)


class SMTPEmailProvider(EmailProvider):
    """SMTP email provider (generic, works with any SMTP server)."""

    def __init__(self):
        self.host = os.getenv("SMTP_HOST")
        self.port = int(os.getenv("SMTP_PORT", "587"))
        self.username = os.getenv("SMTP_USERNAME")
        self.password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", "noreply@riva.ai")
        self.use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    def send(self, message: EmailMessage) -> bool:
        if not self.is_configured():
            return False

        try:
            import smtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            msg = MIMEMultipart('alternative')
            msg['Subject'] = message.subject
            msg['From'] = self.from_email
            msg['To'] = message.to

            msg.attach(MIMEText(message.text_body, 'plain'))
            if message.html_body:
                msg.attach(MIMEText(message.html_body, 'html'))

            with smtplib.SMTP(self.host, self.port, timeout=10) as server:
                if self.use_tls:
                    server.starttls()
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.send_message(msg)
                return True
        except Exception as e:
            print(f"SMTP delivery failed: {e}")
            return False

    def is_configured(self) -> bool:
        return bool(self.host and self.port and self.from_email)


class NullEmailProvider(EmailProvider):
    """Provider that does nothing - for when email is not configured.

    Always returns False so callers know delivery did not happen.
    """

    def send(self, message: EmailMessage) -> bool:
        return False

    def is_configured(self) -> bool:
        return False


def get_email_provider() -> EmailProvider:
    """Get the configured email provider.

    Provider selection (first match wins):
    1. SENDGRID_API_KEY set → SendGrid
    2. SMTP_HOST set → SMTP
    3. DEVELOPMENT=true → Console (dev only)
    4. Otherwise → Null (logs warning, returns False on send)

    Returns:
        Configured provider or NullEmailProvider
    """
    if os.getenv("SENDGRID_API_KEY"):
        return SendGridEmailProvider()

    if os.getenv("SMTP_HOST"):
        return SMTPEmailProvider()

    # Console provider ONLY in explicit development mode
    if os.getenv("DEVELOPMENT", "false").lower() == "true":
        print("⚠️  Using ConsoleEmailProvider (development mode)")
        return ConsoleEmailProvider()

    # Production with no provider configured
    print("⚠️  No email provider configured - verification/reset emails will not be sent")
    return NullEmailProvider()


# Module-level singleton
_provider: EmailProvider | None = None


def get_provider() -> EmailProvider:
    """Get the active email provider (cached)."""
    global _provider
    if _provider is None:
        _provider = get_email_provider()
    return _provider


def send_verification_email(email: str, token: str, base_url: str) -> bool:
    """Send email verification link.

    Args:
        email: Recipient email
        token: Raw verification token (not hashed)
        base_url: Frontend base URL for constructing link

    Returns:
        True if sent successfully, False otherwise
    """
    verification_link = f"{base_url}/verify-email?token={token}"

    message = EmailMessage(
        to=email,
        subject="Verify your RIVA account",
        text_body=f"""Welcome to RIVA AI!

Please verify your email address by clicking the link below:

{verification_link}

This link will expire in 24 hours.

If you didn't create a RIVA account, you can safely ignore this email.

— RIVA Team
""",
        html_body=f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #101C2C;">Welcome to RIVA AI</h2>
    <p>Please verify your email address by clicking the button below:</p>
    <p style="margin: 30px 0;">
        <a href="{verification_link}" style="display: inline-block; background: #101C2C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a>
    </p>
    <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
    <p style="color: #666; font-size: 14px;">If you didn't create a RIVA account, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
    <p style="color: #999; font-size: 12px;">RIVA AI — Intelligent Financial Management</p>
</body>
</html>
""",
    )

    return get_provider().send(message)


def send_password_reset_email(email: str, token: str, base_url: str) -> bool:
    """Send password reset link.

    Args:
        email: Recipient email
        token: Raw reset token (not hashed)
        base_url: Frontend base URL for constructing link

    Returns:
        True if sent successfully, False otherwise
    """
    reset_link = f"{base_url}/reset-password?token={token}"

    message = EmailMessage(
        to=email,
        subject="Reset your RIVA password",
        text_body=f"""You requested to reset your RIVA password.

Click the link below to choose a new password:

{reset_link}

This link will expire in 2 hours.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

— RIVA Team
""",
        html_body=f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #101C2C;">Reset Your Password</h2>
    <p>You requested to reset your RIVA password.</p>
    <p>Click the button below to choose a new password:</p>
    <p style="margin: 30px 0;">
        <a href="{reset_link}" style="display: inline-block; background: #101C2C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
    </p>
    <p style="color: #666; font-size: 14px;">This link will expire in 2 hours.</p>
    <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
    <p style="color: #999; font-size: 12px;">RIVA AI — Intelligent Financial Management</p>
</body>
</html>
""",
    )

    return get_provider().send(message)


def is_email_configured() -> bool:
    """Check if email delivery is configured.

    Use this to determine whether to show email-dependent features in UI.
    """
    return get_provider().is_configured()
