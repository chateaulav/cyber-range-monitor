from api.db.main import get_db
from fastapi import Depends
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession

needs_db = Annotated[AsyncSession, Depends(get_db)]
