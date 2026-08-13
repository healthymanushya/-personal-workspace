"""Regression test for a production incident: a DATABASE_URL containing a
percent-encoded character (e.g. a password with '%40' for '@') made Alembic's
Config.set_main_option raise, since configparser.ConfigParser's
BasicInterpolation treats a bare '%' as the start of an interpolation
sequence. app.database.escape_percent_for_alembic_config must be applied
before storing the URL in Alembic's Config, and the round trip through
get_main_option / get_section must yield the exact original URL."""

import pytest
from alembic.config import Config

from app.database import escape_percent_for_alembic_config

URL_WITH_PERCENT_ENCODING = "postgresql+psycopg2://postgres:Shivam%401223@db.example.supabase.co:5432/postgres"


def test_unescaped_percent_url_breaks_configparser():
    """Reproduces the original bug: setting the raw URL directly fails."""
    config = Config()
    with pytest.raises(Exception):
        config.set_main_option("sqlalchemy.url", URL_WITH_PERCENT_ENCODING)


def test_escaped_percent_url_round_trips_via_get_main_option():
    config = Config()
    config.set_main_option("sqlalchemy.url", escape_percent_for_alembic_config(URL_WITH_PERCENT_ENCODING))
    assert config.get_main_option("sqlalchemy.url") == URL_WITH_PERCENT_ENCODING


def test_escaped_percent_url_round_trips_via_get_section():
    """run_migrations_online() reads the URL back via get_section(), which
    also goes through ConfigParser interpolation -- must match exactly."""
    config = Config()
    config.set_main_option("sqlalchemy.url", escape_percent_for_alembic_config(URL_WITH_PERCENT_ENCODING))
    section = config.get_section(config.config_ini_section, {})
    assert section["sqlalchemy.url"] == URL_WITH_PERCENT_ENCODING


def test_url_without_percent_is_unaffected():
    plain_url = "postgresql+psycopg2://postgres:plainpassword@db.example.supabase.co:5432/postgres"
    config = Config()
    config.set_main_option("sqlalchemy.url", escape_percent_for_alembic_config(plain_url))
    assert config.get_main_option("sqlalchemy.url") == plain_url
