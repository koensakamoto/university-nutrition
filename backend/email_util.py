import aiosmtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# Email configuration
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.getenv("SMTP_USER")  # Your Gmail address
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # Your Gmail app password
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)  # Sender email
FROM_NAME = os.getenv("FROM_NAME", "CrimsonBites")  # Sender name

async def send_email(to_email: str, subject: str, html_content: str, text_content: str = None):
    """Send an email using Gmail SMTP"""
    
    if not SMTP_USER or not SMTP_PASSWORD:
        return False
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        message["To"] = to_email
        
        # Add text and HTML parts
        if text_content:
            text_part = MIMEText(text_content, "plain")
            message.attach(text_part)
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
        )
        
        return True
        
    except Exception:
        return False

async def send_password_reset_email(to_email: str, reset_token: str):
    """Send password reset email"""
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    subject = "Reset Your CrimsonBites Password"
    
    # HTML email content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }}
            .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
            .button {{ display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🍎 CrimsonBites</h1>
                <h2>Password Reset Request</h2>
            </div>
            <div class="content">
                <p>Hi there!</p>
                <p>We received a request to reset your password for your CrimsonBites account. If you didn't make this request, you can safely ignore this email.</p>
                <p>To reset your password, click the button below:</p>
                <p style="text-align: center;">
                    <a href="{reset_link}" class="button">Reset My Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #efefef; padding: 10px; border-radius: 4px; font-family: monospace;">
                    {reset_link}
                </p>
                <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
                <div class="footer">
                    <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
                    <p>Thanks,<br>The CrimsonBites Team</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version (fallback)
    text_content = f"""
    CrimsonBites - Password Reset Request
    
    Hi there!
    
    We received a request to reset your password for your CrimsonBites account.
    
    To reset your password, visit this link:
    {reset_link}
    
    This link will expire in 1 hour for security reasons.
    
    If you didn't make this request, you can safely ignore this email.
    
    Thanks,
    The CrimsonBites Team
    """
    
    return await send_email(to_email, subject, html_content, text_content)