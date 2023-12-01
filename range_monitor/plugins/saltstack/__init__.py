"""
Guacamole Monitor
"""
import datetime
from flask import Blueprint, render_template, jsonify, request
from range_monitor.auth import login_required, admin_required, user_required
from . import guac_data
from . import parse

bp = Blueprint('salt',
               __name__,
               template_folder='./templates',
               static_folder='./static')

@bp.route('/')
@login_required
def minions():
    """
    Renders the active minions from the server.

    Returns:
        str: The rendered HTML template for displaying the active minions.
    """

    return render_template('salt/minions.html')


@bp.route('/events', methods=['GET'])
@login_required
def events():
    """
    Renders the events from the server.

    Returns:
        str: The rendered HTML template for displaying the events.
    """

    return render_template('salt/events.html')


@bp.route('/jobs', methods=['GET'])
@login_required
def jobs():
    """
    Renders the active jobs from the server.

    Returns:
        str: The rendered HTML template for displaying the active jobs.
    """

    users = guac_data.get_active_users()

    return render_template('salt/jobs.html',
                           active_users=users)


@bp.route('/<int:identifier>/connection_timeline', methods=('GET', 'POST'))
@login_required
def connection_timeline(identifier):
    """
    Renders the active connections from the server.

    Returns:
        str: The rendered HTML template for displaying the active connections.
    """

    history = None
    if request.method == 'POST':
        history = guac_data.get_connection_history(identifier)

    return render_template('salt/timeline.html',
                           history=history)


@bp.route('/api/conns_data')
@login_required
def get_graph_data():
    """
    Retrieve and return the graph data.

    Args:
        timeout (Optional[int]): The timeout value for the data retrieval.

    Returns:
        dict: A dictionary containing the graph data with the following keys:
            - date (str): The current date and time in the format "HH:MM:SS".
            - conns (int): The number of active connections.

    Raises:
        None
    """

    date = datetime.datetime.now().strftime("%H:%M:%S")
    active_conns = guac_data.get_active_conns()

    graph_data = {
        'date': date,
        'amount': len(active_conns),
        'conns': active_conns
    }

    return jsonify(graph_data)


last_conn_tree = {}
last_connections = {}

@bp.route('/api/topology_data')
@login_required
def get_tree_data():
    """
    Retrieves the tree data for the topology API.

    Parameters:
        timeout (float, optional): The timeout value in seconds for the request. Defaults to None.

    Returns:
        Response: The JSON response containing the extracted connections.
    """

    global last_conn_tree
    global last_connections
    conn_tree = guac_data.get_tree_data()

    if last_conn_tree != conn_tree:
        connections = parse.extract_connections(conn_tree)
        connections = guac_data.resolve_users(connections)
        last_conn_tree = conn_tree
        last_connections = connections

    return jsonify(last_connections)


@bp.route('/connect-to-node', methods=['POST'])
@user_required
def connect_to_node():
    """
    Connects to a node.

    Args:
        None

    Returns:
        A JSON response with an empty dictionary.
    """

    data = request.get_json()
    identifier = data['identifier']

    url = guac_data.get_connection_link(identifier)

    return jsonify({'url': url})


@bp.route('/kill-connections', methods=['POST'])
@admin_required
def kill_node_connections():
    """
    Connects to a node.

    Args:
        None

    Returns:
        A JSON response with an empty dictionary.
    """

    data = request.get_json()
    identifier = data['identifier']

    response = guac_data.kill_connection(identifier)

    return jsonify(response)


@bp.route('/get-node-history', methods=['POST'])
@user_required
def get_node_history():
    """
    Retrieves the history of a node.

    Args:
        None

    Returns:
        A JSON response with an empty dictionary.
    """

    data = request.get_json()
    identifier = data['identifier']

    history = guac_data.get_connection_history(identifier)

    return jsonify({'history': history})
