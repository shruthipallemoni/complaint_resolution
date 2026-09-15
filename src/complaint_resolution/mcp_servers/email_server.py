import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

mcp = FastMCP("email-server")

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


@mcp.tool()
def send_email(to: str, subject: str, body: str) -> str:
    """Sends an email via Gmail SMTP. Only call this after a human has
    approved the exact content to be sent — this tool sends immediately,
    with no further review step."""
    message = MIMEText(body)
    message["From"] = GMAIL_ADDRESS
    message["To"] = to
    message["Subject"] = subject

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_ADDRESS, [to], message.as_string())

    return f"Email sent successfully to {to}"


if __name__ == "__main__":
    mcp.run()