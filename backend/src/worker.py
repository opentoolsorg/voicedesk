"""Cloudflare Python Worker entrypoint: FastAPI on D1, dashboard served from static assets."""

import os
from urllib.parse import urlparse

from js import Object
from workers import WorkerEntrypoint, asgi
from sqlalchemy_cloudflare_d1 import create_engine_from_binding

# Module-scope imports land in the deploy-time memory snapshot; importing per request blows the CPU limit.
from app.core import database
from app.core.config import Settings, get_settings
from app.main import create_app, init_db

_app = None


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        global _app
        url = urlparse(request.url)
        parts = url.path.split("/")
        # Static export ships one "_" shell per dynamic id: map /dashboard/<id>[.txt|/...] onto it.
        if len(parts) > 2 and parts[1] == "dashboard":
            stem, dot, ext = parts[2].partition(".")
            if stem and not stem.startswith("_") and stem != "new":
                parts[2] = "_" + dot + ext
            return await self.env.ASSETS.fetch(url._replace(path="/".join(parts)).geturl())

        if _app is None:
            for key in Object.keys(self.env):
                value = getattr(self.env, key)
                if isinstance(value, str):
                    os.environ[key] = value
            # Modules captured `settings` before vars/secrets existed; refresh that shared object in place.
            get_settings().__dict__.update(Settings().__dict__)
            database.d1_engine = create_engine_from_binding(self.env.DB)
            init_db(database.d1_engine)
            # Rebuild so CORS/docs reflect the real APP_ENV, not the snapshot-time defaults.
            _app = create_app()
        return await asgi.fetch(_app, request, self.env)
