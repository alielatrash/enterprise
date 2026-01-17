"""Database initialization and connection"""

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

# Create engine
engine = create_engine(
    settings.database_url,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)


def init_db():
    """Initialize database tables"""
    SQLModel.metadata.create_all(engine)
    print("✓ Database initialized")


def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session


if __name__ == "__main__":
    init_db()
