import logging

class BaseAgent:
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
        self.logger = logging.getLogger(name)

    def analyze(self, event_data: dict, graph_context: dict) -> dict:
        """
        Analyze incoming signals using agent-specific intelligence.
        To be overridden by subclasses.
        """
        raise NotImplementedError("Each agent must implement its own analyze method.")

    def log_activity(self, message: str):
        self.logger.info(f"[{self.role}] {message}")
