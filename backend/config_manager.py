"""
Configuration manager for Pluto Lander
Handles persistent storage of settings and user data
"""
from pathlib import Path
import json
from .models import SettingsPublic, User
from .security import hash_password

CONFIG_DIR = Path(__file__).parent / "config"
CONFIG_DIR.mkdir(parents=True, exist_ok=True)

USER_FILE = CONFIG_DIR / "user.json"
SETTINGS_FILE = CONFIG_DIR / "settings.json"


def ensure_default_user():
    """Create default admin user if not exists"""
    if USER_FILE.exists():
        return
    user = {
        "username": "admin",
        "password_hash": hash_password("pluto123")
    }
    USER_FILE.write_text(json.dumps(user))
    print("[Pluto] 🔐 Default admin user created: admin / pluto123 (CHANGE THIS!)")


def load_user() -> User:
    """Load user from config file"""
    data = json.loads(USER_FILE.read_text())
    return User(**data)


def save_user(user: User):
    """Save user to config file"""
    USER_FILE.write_text(json.dumps(user.__dict__))


def load_settings() -> SettingsPublic:
    """Load settings from config file"""
    if not SETTINGS_FILE.exists():
        default = SettingsPublic()
        save_settings(default)
        return default
    
    data = json.loads(SETTINGS_FILE.read_text())
    return SettingsPublic(**data)


def save_settings(settings: SettingsPublic):
    """Save settings to config file with masked values"""
    data = settings.dict()
    
    # Create masked versions of sensitive data
    if data.get("alpaca_api_key"):
        key = data["alpaca_api_key"]
        data["alpaca_api_key_masked"] = key[:4] + "*" * 8 if len(key) > 4 else "****"
    else:
        data["alpaca_api_key_masked"] = None
        
    if data.get("alpaca_api_secret"):
        data["alpaca_api_secret_masked"] = "****" + data["alpaca_api_secret"][-4:] if len(data["alpaca_api_secret"]) > 4 else "****"
    else:
        data["alpaca_api_secret_masked"] = None
    
    SETTINGS_FILE.write_text(json.dumps(data, indent=2))
    print("[Pluto] 💾 Settings saved")


def update_user_password(new_password: str):
    """Update admin password"""
    user = load_user()
    user.password_hash = hash_password(new_password)
    save_user(user)
    print("[Pluto] 🔐 Password updated")
