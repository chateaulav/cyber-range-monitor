import requests
import json
from range_monitor.db import get_db

def salt_conn():
    db = get_db()
    salt_entry = db.execute(
        'SELECT s.*'
        ' FROM saltstack s'
        ' WHERE s.enabled = 1'
    ).fetchone()

    if not salt_entry:
        return None
    
    salt_data = {
        key: salt_entry[key]
        for key in salt_entry.keys()
    }
    return salt_data

def rest_login(username, password, url):
    try:
        login = requests.post(
                    f'https://{url}:8000/login',
                    verify=False,
                    json={
                        'username':username,
                        'password':password,
                        'eauth':'pam'
                    }
                )
        token = json.loads(login.text)["return"][0]["token"]
        print(login)
        print ("Success")
        return token
    except Exception as e:
        print("Unable to authenticate ", username, e)
        return False

def execute_function(username, password, url, cmd):
    try:
        token = rest_login(username, password, url)
        response = requests.post( 
                    f'https://{url}:8000/',
                    verify=False,
                    headers= {
                        "X-Auth-Token" : token
                    },
                    json = [
                            {
                            'client': 'local',
                            'tgt': 'salt-dev',
                            'fun': cmd
                            }
                        ]
                )
        return response.json()
    except Exception as e:
        print("Unable to execute:", e)
        return False
    

def execute_function_args(username, password, url, cmd, args):
    try:
        token = rest_login(username, password, url)
        response = requests.post( 
                    f'https://{url}:8000/',
                    verify=False,
                    headers= {
                        "X-Auth-Token" : token
                    },
                    json = [
                            {
                            'client': 'local',
                            'tgt': 'salt-dev',
                            'fun': cmd,
                            'arg': [args]
                            }
                        ]
                )
        return response.json()
    except Exception as e:
        print("Unable to execute:", e)
        return {'message': e}

# args = ['id', 'os', 'uuid', 'saltversion', 'build_phase', 'role', 'type', 'username']
# #execute_function(username, password, url, "monitor.gather_jobs")
# #execute_function(username, password, url, "monitor.gather_minions")
# data =- salt_conn()
# execute_function_args(data['username'], data['password'], data['url'], "monitor.gather_minions_args", args)