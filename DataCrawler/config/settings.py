import os
from dotenv import load_dotenv
from typing import Dict, Any

load_dotenv()

class WebConfig:
    BASE_URL = os.getenv('WEB_BASE_URL', 'https://seusistema.com')
    USERNAME = os.getenv('WEB_USERNAME')
    PASSWORD = os.getenv('WEB_PASSWORD')
    LOGIN_URL = os.getenv('WEB_LOGIN_URL', '/login')
    TIMEOUT = int(os.getenv('WEB_TIMEOUT', '30'))
    
    SELECTORS = {
        'username_field': os.getenv('USERNAME_SELECTOR', '#username'),
        'password_field': os.getenv('PASSWORD_SELECTOR', '#password'),
        'login_button': os.getenv('LOGIN_BUTTON_SELECTOR', 'button[type="submit"]'),
        'client_table': os.getenv('CLIENT_TABLE_SELECTOR', '.client-table'),
        'client_rows': os.getenv('CLIENT_ROWS_SELECTOR', '.client-row'),
        'client_id': os.getenv('CLIENT_ID_SELECTOR', '.client-id'),
        'client_name': os.getenv('CLIENT_NAME_SELECTOR', '.client-name'),
        'client_email': os.getenv('CLIENT_EMAIL_SELECTOR', '.client-email'),
        'client_phone': os.getenv('CLIENT_PHONE_SELECTOR', '.client-phone'),
        'services_table': os.getenv('SERVICES_TABLE_SELECTOR', '.services-table'),
        'service_rows': os.getenv('SERVICE_ROWS_SELECTOR', '.service-row'),
        'service_date': os.getenv('SERVICE_DATE_SELECTOR', '.service-date'),
        'service_type': os.getenv('SERVICE_TYPE_SELECTOR', '.service-type'),
        'service_description': os.getenv('SERVICE_DESCRIPTION_SELECTOR', '.service-description'),
        'service_status': os.getenv('SERVICE_STATUS_SELECTOR', '.service-status')
    }

class DatabaseConfig:
    SERVER = os.getenv('DB_SERVER', 'localhost\\SQLEXPRESS')
    DATABASE = os.getenv('DB_NAME', 'ClientServiceDB')
    USERNAME = os.getenv('DB_USERNAME', 'sa')
    PASSWORD = os.getenv('DB_PASSWORD')
    TRUSTED_CONNECTION = os.getenv('DB_TRUSTED_CONNECTION', 'no').lower() == 'yes'
    
    @property
    def connection_string(self) -> str:
        if self.TRUSTED_CONNECTION:
            return f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={self.SERVER};DATABASE={self.DATABASE};Trusted_Connection=yes;'
        else:
            return f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={self.SERVER};DATABASE={self.DATABASE};UID={self.USERNAME};PWD={self.PASSWORD};'

class CrawlerConfig:
    DELAY_BETWEEN_REQUESTS = float(os.getenv('DELAY_BETWEEN_REQUESTS', '2.0'))
    MAX_RETRIES = int(os.getenv('MAX_RETRIES', '3'))
    HEADLESS_MODE = os.getenv('HEADLESS_MODE', 'true').lower() == 'true'
    DOWNLOAD_PATH = os.getenv('DOWNLOAD_PATH', './downloads')
    
    DATA_RETENTION_DAYS = int(os.getenv('DATA_RETENTION_DAYS', '365'))

web_config = WebConfig()
db_config = DatabaseConfig()
crawler_config = CrawlerConfig()