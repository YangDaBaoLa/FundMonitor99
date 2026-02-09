"""
Fund Monitor - Backend Configuration
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""

    # App Settings
    APP_NAME: str = "Fund Monitor API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    PORT: int = 8000  # 服务端口

    # CORS Settings - 允许所有本地开发端口
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ]

    # Cache Settings
    CACHE_TTL_REALTIME: int = 10  # 实时数据缓存 10 秒
    CACHE_TTL_LIST: int = 30  # 列表数据缓存 30 秒
    CACHE_TTL_DETAIL: int = 60  # 详情数据缓存 60 秒
    CACHE_TTL_HISTORY: int = 3600  # 历史数据缓存 1 小时

    # API Settings
    REQUEST_TIMEOUT: int = 10  # API 请求超时时间
    MAX_RETRY: int = 3  # 最大重试次数

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
