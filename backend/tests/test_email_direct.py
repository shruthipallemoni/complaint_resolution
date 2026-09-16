# test_email_direct.py
import os
from dotenv import load_dotenv
load_dotenv() 

print("EMAIL:", os.getenv("GMAIL_ADDRESS"))
print("PASSWORD:", os.getenv("GMAIL_APP_PASSWORD"))
# print("PASSWORD LENGTH:", len(GMAIL_APP_PASSWORD))
from complaint_resolution.mcp_servers.email_server import send_email

result = send_email(
    to="b221486@rgukt.ac.in",
    subject="Direct SMTP test",
    body="If this arrives, the SMTP code itself is correct."
)
print(result)