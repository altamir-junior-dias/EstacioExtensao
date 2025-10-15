from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Client:
    client_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    extraction_date: Optional[datetime] = None
    
    def to_dict(self) -> dict:
        return {
            'client_id': self.client_id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'extraction_date': self.extraction_date or datetime.now()
        }

@dataclass
class Service:
    client_id: str
    service_date: str
    service_type: str
    description: str
    status: str
    extraction_date: Optional[datetime] = None
    
    def to_dict(self) -> dict:
        return {
            'client_id': self.client_id,
            'service_date': self.service_date,
            'service_type': self.service_type,
            'description': self.description,
            'status': self.status,
            'extraction_date': self.extraction_date or datetime.now()
        }