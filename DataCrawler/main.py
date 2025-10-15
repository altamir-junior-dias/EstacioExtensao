import logging
import time
from datetime import datetime

from crawlers.selenium_crawler import SeleniumCrawler
from database.db_handler import SQLServerHandler
from config.settings import crawler_config

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'crawler_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def main():
    logger.info("Iniciando crawler de clientes e serviços")
    
    crawler = SeleniumCrawler()
    db_handler = SQLServerHandler()
    
    try:
        if not crawler.login():
            logger.error("Falha no login. Encerrando execução.")
            return
        
        logger.info("Buscando clientes...")
        clients = crawler.search_clients()
        
        if not clients:
            logger.warning("Nenhum cliente encontrado")
            return
        
        all_services = []
        for i, client in enumerate(clients, 1):
            logger.info(f"Buscando serviços do cliente {i}/{len(clients)}: {client.name}")
            
            services = crawler.get_client_services(client.client_id)
            all_services.extend(services)
            
            if i < len(clients):
                time.sleep(crawler_config.DELAY_BETWEEN_REQUESTS)
        
        logger.info("Salvando dados no SQL Server...")
        
        if clients:
            db_handler.save_clients(clients)
        
        if all_services:
            db_handler.save_services(all_services)
        
        logger.info("Executando limpeza de dados antigos...")
        db_handler.cleanup_old_data()
        
        total_clients = db_handler.get_client_count()
        total_services = db_handler.get_service_count()
        
        logger.info(f"Extracção concluída com sucesso!")
        logger.info(f"Clientes no banco: {total_clients}")
        logger.info(f"Serviços no banco: {total_services}")
        logger.info(f"Novos clientes extraídos: {len(clients)}")
        logger.info(f"Novos serviços extraídos: {len(all_services)}")
        
    except Exception as e:
        logger.error(f"Erro durante execução do crawler: {e}")
    
    finally:
        crawler.close()
        logger.info("Crawler finalizado")

if __name__ == "__main__":
    main()