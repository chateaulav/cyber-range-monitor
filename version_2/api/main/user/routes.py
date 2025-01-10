from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.models.schemas.user_schema import CreateUser, UpdateUser, ReadUser
from api.main.user.services import UserService
from api.utils.dependencies import needs_db


user_router = APIRouter(
    prefix='/user',
    tags=['User']
)
user_service = UserService()



@user_router.post('/register', response_model=ReadUser, status_code=status.HTTP_201_CREATED)
async def create_user(
    create_req: CreateUser,
    db: needs_db
) -> ReadUser:
    '''
    creates a user given the request body schema
    Arguments:
        create_schema {CreateUser} -- the request body schema
    Keyword Arguments:
        db {AsyncSession} - default: {Depends(get_db)})
    Raises:
        HTTPException: 400 - Username is already taken
    Returns:
        ReadUser -- the created user
    '''
    username_taken = await user_service.username_is_taken(db, create_req.username)
    if username_taken:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Username is already taken'
        )

    resulting_user = await user_service.create_user(db, create_req)
    return resulting_user  # type: ignore


@user_router.put('/{user_id}', response_model=ReadUser, status_code=status.HTTP_200_OK)
async def update_user(
    user_id: int,
    update_req: UpdateUser,
    db: needs_db
) -> ReadUser:
    '''
    updates the user given an id and uses the schema to update the user's data

    Arguments:
        user_id {int} -- user id
        update_schema {UpdateUser} -- the request body schema
    Keyword Arguments:
        db {AsyncSession} -- (default: {Depends(get_db)})
    Returns:
        ReadUser
    '''
    
    updated_data = await user_service.update_user(db, user_id, update_req)
    return updated_data  # type: ignore


@user_router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: needs_db) -> None:
    if not await user_service.is_authenticated():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Unauthorized'
        )
    await user_service.delete_user(db, user_id)


@user_router.get('/{user_id}', response_model=ReadUser, status_code=status.HTTP_200_OK)
async def read_user(user_id: int, db: needs_db) -> ReadUser:
    user = await user_service.get_by_id(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found'
        )
    return user  # type: ignore


@user_router.get('/', response_model=list[ReadUser])
async def read_all_users(db: needs_db) -> list[ReadUser]:
    users = await user_service.get_all(db)
    return users  # type: ignore