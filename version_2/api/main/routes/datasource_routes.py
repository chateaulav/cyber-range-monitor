from fastapi import APIRouter
from api.models.data_source import Guacamole, Openstack, Saltstack
from api.main.schemas import (
    GuacCreate, GuacRead, GuacUpdate,
    OpenstackCreate, OpenstackRead, OpenstackUpdate,
    SaltstackCreate, SaltstackRead, SaltstackUpdate
)
from api.main.utils.datasource_factory import create_data_source_router

ROUTE_CONFIGS: list[dict] = [
    {
        'datasource_model': Guacamole,
        'create_schema': GuacCreate,
        'read_schema': GuacRead,
        'update_schema': GuacUpdate,
        'datasource_name': 'guac'
    },
    {
        'datasource_model': Openstack,
        'create_schema': OpenstackCreate,
        'read_schema': OpenstackRead,
        'update_schema': OpenstackUpdate,
        'datasource_name': 'openstack'
    },
    {
        'datasource_model': Saltstack,
        'create_schema': SaltstackCreate,
        'read_schema': SaltstackRead,
        'update_schema': SaltstackUpdate,
        'datasource_name': 'saltstack'
    }    
]

def init_datasource_routes() -> APIRouter:
    '''
    Creates the API Router for all of the Datasources
    using ROUTE_CONFIGS and create_data_source_router
    factory function 
    
    Returns:
        APIRouter -- the datasource API router
    '''    
    ds_router = APIRouter(prefix='/datasources')
    for route_config in ROUTE_CONFIGS:
        print(f'[>] Creating route for {route_config["datasource_name"]}')
        ds_router.include_router(
            create_data_source_router(
                **route_config
            )   
        )
    return ds_router
        
    
    
    
    
    



'''
for each of the datasources

/<datasource_name> [GET] - list all data sources
/<datasource_name> [POST] - create a new data source

/<datasource_name>/<datasource_id> [GET] - get a data source
/<datasource_name>/<datasource_id> [PUT] - update a data source
/<datasource_name>/<datasource_id> [DELETE] - delete a data source

/<datasource_name>/<datasource_id>/ [POST] - toggle a datasource 


but they each have different names and attributes 

-create a generic service class?

'''