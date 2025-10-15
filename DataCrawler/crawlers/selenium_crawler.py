from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import logging
import time
from typing import List, Optional
from datetime import datetime

from config.settings import web_config, crawler_config
from models.data_models import Client, Service

logger = logging.getLogger(__name__)

class SeleniumCrawler:
    def __init__(self):
        self.driver = None
        self.wait = None
        self.logged_in = False
        self.setup_driver()
    
    def setup_driver(self):
        try:
            chrome_options = Options()
            
            if crawler_config.HEADLESS_MODE:
                chrome_options.add_argument('--headless')
            
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option('excludeSwitches', ['enable-automation'])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            self.wait = WebDriverWait(self.driver, web_config.TIMEOUT)
            logger.info("Driver do Chrome configurado com sucesso")
            
        except Exception as e:
            logger.error(f"Erro ao configurar driver: {e}")
            raise
    
    def login(self) -> bool:
        try:
            logger.info(f"Realizando login em {web_config.BASE_URL}")
            self.driver.get(web_config.BASE_URL + web_config.LOGIN_URL)
            
            # Aguardar e preencher campos de login
            username_field = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, web_config.SELECTORS['username_field']))
            )
            password_field = self.driver.find_element(By.CSS_SELECTOR, web_config.SELECTORS['password_field'])
            
            username_field.clear()
            username_field.send_keys(web_config.USERNAME)
            
            password_field.clear()
            password_field.send_keys(web_config.PASSWORD)
            
            login_button = self.driver.find_element(By.CSS_SELECTOR, web_config.SELECTORS['login_button'])
            login_button.click()
            
            time.sleep(3)
            
            if "dashboard" in self.driver.current_url or "home" in self.driver.current_url:
                self.logged_in = True
                logger.info("Login realizado com sucesso")
                return True
            else:
                logger.error("Falha no login - URL não redirecionou para área logada")
                return False
                
        except TimeoutException:
            logger.error("Timeout durante o login")
            return False
        except Exception as e:
            logger.error(f"Erro durante login: {e}")
            return False
    
    def search_clients(self, search_term: str = "") -> List[Client]:
        clients = []
        
        if not self.logged_in:
            logger.error("Não está logado no sistema")
            return clients
        
        try:
            clients_url = f"{web_config.BASE_URL}/clientes"
            self.driver.get(clients_url)
            
            if search_term:
                search_field = self.wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='search']"))
                )
                search_field.clear()
                search_field.send_keys(search_term)
                time.sleep(1)
            
            self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, web_config.SELECTORS['client_table']))
            )
            
            client_rows = self.driver.find_elements(By.CSS_SELECTOR, web_config.SELECTORS['client_rows'])
            
            for row in client_rows:
                client = self._parse_client_row(row)
                if client:
                    clients.append(client)
            
            logger.info(f"Encontrados {len(clients)} clientes")
            return clients
            
        except Exception as e:
            logger.error(f"Erro ao buscar clientes: {e}")
            return clients
    
    def _parse_client_row(self, row) -> Optional[Client]:
        try:
            client_id = row.find_element(By.CSS_SELECTOR, web_config.SELECTORS['client_id']).text.strip()
            name = row.find_element(By.CSS_SELECTOR, web_config.SELECTORS['client_name']).text.strip()
            
            try:
                email = row.find_element(By.CSS_SELECTOR, web_config.SELECTORS['client_email']).text.strip()
            except NoSuchElementException:
                email = None
            
            try:
                phone = row.find_element(By.CSS_SELECTOR, web_config.SELECTORS['client_phone']).text.strip()
            except NoSuchElementException:
                phone = None
            
            return Client(
                client_id=client_id,
                name=name,
                email=email,
                phone=phone,
                extraction_date=datetime.now()
            )
            
        except Exception as e:
            logger.warning(f"Erro ao parsear linha do cliente: {e}")
            return None
    
    def get_client_services(self, client_id: str) -> List[Service]:
        services = []
        
        if not self.logged_in:
            logger.error("Não está logado no sistema")
            return services
        
        try:
            services_url = f"{web_config.BASE_URL}/clientes/{client_id}/servicos"
            self.driver.get(services_url)
            
            time.sleep(2)
            
            try:
                service_rows = self.driver.find_elements(By.CSS_SELECTOR, web_config.SELECTORS['service_rows'])
            except NoSuchElementException:
                logger.info(f"Nenhum serviço encontrado para o cliente {client_id}")
                return services
            
            for row in service_rows:
                service = self._parse_service_row(row, client_id)
                if service:
                    services.append(service)
            
            logger.info(f"Encontrados {len(services)} serviços para cliente {client_id}")
            return services
            
        except Exception as e:
            logger.error(f"Erro ao buscar serviços do cliente {client_id}: {e}")
            return services
    
    def _parse_service_row(self, row, client_id: str) -> Optional[Service]:
        try:
            service_date = row.find_element(By.CSS_SELECTOR, web_config.SELECTORS['service_date']).text.strip()
            service_type = row.find_element(By.CSS_SELECTOR, web_config.SELECTORS['service_type']).text.strip()
            
            try:
                description = row.find_element(By.CSS_SELECTOR, web_config.SELECTORS['service_description']).text.strip()
            except NoSuchElementException:
                description = ""
            
            try:
                status = row.find_element(By.CSS_SELECTOR, web_config.SELECTORS['service_status']).text.strip()
            except NoSuchElementException:
                status = "Desconhecido"
            
            return Service(
                client_id=client_id,
                service_date=service_date,
                service_type=service_type,
                description=description,
                status=status,
                extraction_date=datetime.now()
            )
            
        except Exception as e:
            logger.warning(f"Erro ao parsear linha do serviço: {e}")
            return None
    
    def close(self):
        if self.driver:
            self.driver.quit()
            logger.info("Driver fechado")