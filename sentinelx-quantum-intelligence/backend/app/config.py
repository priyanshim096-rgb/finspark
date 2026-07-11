import os

class Config:
    PROJECT_NAME = "SentinelX Quantum Intelligence Platform"
    API_V1_STR = "/api"
    WS_STR = "/ws"
    
    # In-memory SQLite for testing/mocking
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sentinelx.db"
    
    # Neo4j Sim configuration
    NEO4J_ENABLED = False  # Set to true if a real Neo4j server is present
    NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
    
    # LLM Mocking / Remote config
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "mock-key")
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "SENTINELX-SUPER-SECRET-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

settings = Config()
