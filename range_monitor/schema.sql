DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS config;
DROP TABLE IF EXISTS user_permissions;

CREATE TABLE user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

INSERT INTO user (username, password)
VALUES
  ('admin', 'scrypt:32768:8:1$OZrgrecSOwvEYxBR$b7b5fc887dc6a227c8eb35e22c602e5a62f9305d8458a898bf42a920b84e03b282d8187410d5ad989af71d1120c7b5213466afb42d1a133100101ea06a02da1e');

CREATE TABLE user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  permission TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user (id)
);

INSERT INTO user_permissions (user_id, permission)
VALUES
  (1, 'admin');
