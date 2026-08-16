class NotFoundError(Exception):
    def __init__(self, entity: str, identifier: str) -> None:
        super().__init__(f"{entity} not found: {identifier}")
        self.entity = entity
        self.identifier = identifier
