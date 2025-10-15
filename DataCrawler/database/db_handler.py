import pyodbc
import logging
from typing import List, Optional
from datetime import datetime, timedelta

from config.settings import db_config, crawler_config
from models.data_models import Client, Service

logger = logging.getLogger(__name__)

class SQLServerHandler:
    def __init__(self):
        self.connection_string = db_config.connection_string
        self.connection = None
        self._create_tables()
    
    def connect(self) -> bool:
        try:
            self.connection = pyodbc.connect(self.connection_string)
            logger.info("Conexão com SQL Server estabelecida com sucesso")
            return True
        except pyodbc.Error as e:
            logger.error(f"Erro ao conectar com SQL Server: {e}")
            return False
    
    def disconnect(self):
        if self.connection:
            self.connection.close()
            logger.info("Conexão com SQL Server fechada")
    
    def _create_tables(self):
        if not self.connect():
            return
        
        try:
            cursor = self.connection.cursor()
            
            # Tabela de clientes
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='clientes' AND xtype='U')
                CREATE TABLE clientes (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    client_id NVARCHAR(100) NOT NULL,
                    name NVARCHAR(255) NOT NULL,
                    email NVARCHAR(255),
                    phone NVARCHAR(50),
                    extraction_date DATETIME2 NOT NULL,
                    created_at DATETIME2 DEFAULT GETDATE(),
                    UNIQUE(client_id, extraction_date)
                )
            """)
            
            # Tabela de serviços
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='servicos' AND xtype='U')
                CREATE TABLE servicos (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    client_id NVARCHAR(100) NOT NULL,
                    service_date NVARCHAR(50) NOT NULL,
                    service_type NVARCHAR(255) NOT NULL,
                    description NVARCHAR(MAX),
                    status NVARCHAR(100),
                    extraction_date DATETIME2 NOT NULL,
                    created_at DATETIME2 DEFAULT GETDATE(),
                    UNIQUE(client_id, service_date, service_type, extraction_date)
                )
            """)
            
            # Índices para melhor performance
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_clientes_client_id')
                CREATE INDEX idx_clientes_client_id ON clientes(client_id)
            """)
            
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_servicos_client_id')
                CREATE INDEX idx_servicos_client_id ON servicos(client_id)
            """)
            
            cursor.execute("""
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_servicos_service_date')
                CREATE INDEX idx_servicos_service_date ON servicos(service_date)
            """)
            
            self.connection.commit()
            logger.info("Tabelas verificadas/criadas com sucesso")
            
        except pyodbc.Error as e:
            logger.error(f"Erro ao criar tabelas: {e}")
        finally:
            self.disconnect()
    
    def save_clients(self, clients: List[Client]) -> bool:
        if not self.connect():
            return False
        
        try:
            cursor = self.connection.cursor()
            
            for client in clients:
                cursor.execute("""
                    INSERT INTO clientes (client_id, name, email, phone, extraction_date)
                    VALUES (?, ?, ?, ?, ?)
                """, client.client_id, client.name, client.email, client.phone, 
                   client.extraction_date or datetime.now())
            
            self.connection.commit()
            logger.info(f"{len(clients)} clientes salvos no banco de dados")
            return True
            
        except pyodbc.Error as e:
            logger.error(f"Erro ao salvar clientes: {e}")
            self.connection.rollback()
            return False
        finally:
            self.disconnect()
    
    def save_services(self, services: List[Service]) -> bool:
        if not self.connect():
            return False
        
        try:
            cursor = self.connection.cursor()
            
            for service in services:
                cursor.execute("""
                    INSERT INTO servicos (client_id, service_date, service_type, description, status, extraction_date)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, service.client_id, service.service_date, service.service_type, 
                   service.description, service.status, service.extraction_date or datetime.now())
            
            self.connection.commit()
            logger.info(f"{len(services)} serviços salvos no banco de dados")
            return True
            
        except pyodbc.Error as e:
            logger.error(f"Erro ao salvar serviços: {e}")
            self.connection.rollback()
            return False
        finally:
            self.disconnect()
    
    def cleanup_old_data(self):
        if not self.connect():
            return
        
        try:
            cursor = self.connection.cursor()
            cutoff_date = datetime.now() - timedelta(days=crawler_config.DATA_RETENTION_DAYS)
            
            cursor.execute("DELETE FROM clientes WHERE extraction_date < ?", cutoff_date)
            client_deleted = cursor.rowcount
            
            cursor.execute("DELETE FROM servicos WHERE extraction_date < ?", cutoff_date)
            service_deleted = cursor.rowcount
            
            self.connection.commit()
            logger.info(f"Limpeza concluída: {client_deleted} clientes e {service_deleted} serviços removidos")
            
        except pyodbc.Error as e:
            logger.error(f"Erro na limpeza de dados: {e}")
        finally:
            self.disconnect()
    
    def get_client_count(self) -> int:
        if not self.connect():
            return 0
        
        try:
            cursor = self.connection.cursor()
            cursor.execute("SELECT COUNT(DISTINCT client_id) FROM clientes")
            return cursor.fetchone()[0]
        except pyodbc.Error as e:
            logger.error(f"Erro ao contar clientes: {e}")
            return 0
        finally:
            self.disconnect()
    
    def get_service_count(self) -> int:
        if not self.connect():
            return 0
        
        try:
            cursor = self.connection.cursor()
            cursor.execute("SELECT COUNT(*) FROM servicos")
            return cursor.fetchone()[0]
        except pyodbc.Error as e:
            logger.error(f"Erro ao contar serviços: {e}")
            return 0
        finally:
            self.disconnect()