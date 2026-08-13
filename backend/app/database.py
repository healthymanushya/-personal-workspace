from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


def _normalize_database_url(url: str) -> str:
    # Render (and Heroku-style) Postgres URLs use the "postgres://" scheme,
    # which SQLAlchemy's psycopg2 dialect no longer accepts.
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    return url


def escape_percent_for_alembic_config(url: str) -> str:
    """Alembic's Config stores values in a configparser.ConfigParser with
    BasicInterpolation, which treats a bare '%' as the start of an
    interpolation sequence and raises on set() if it isn't followed by
    another '%' or '('. A literal '%' in the URL (e.g. from a percent-encoded
    password like %40) must be doubled to '%%' before being passed to
    config.set_main_option, so ConfigParser's interpolation step collapses it
    back to a single '%' when the value is read back via get_main_option /
    get_section. This only affects how the value is stored in Alembic's
    Config object -- it is not used for the actual SQLAlchemy engine URL.
    """
    return url.replace("%", "%%")


database_url = _normalize_database_url(settings.database_url)
is_sqlite = database_url.startswith("sqlite")

connect_args = {"check_same_thread": False} if is_sqlite else {}
engine_kwargs = {} if is_sqlite else {"pool_pre_ping": True}

engine = create_engine(database_url, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
