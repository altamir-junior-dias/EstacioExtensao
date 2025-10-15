import logging
import time
from typing import Callable

def retry_on_failure(max_retries: int = 3, delay: float = 2.0):
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    logging.warning(f"Tentativa {attempt + 1} falhou: {e}. Retentando em {delay}s...")
                    time.sleep(delay)
            return None
        return wrapper
    return decorator