CREATE TABLE points (
  uuid BINARY(16) NOT NULL,
  num INTEGER NOT NULL,

  latitued DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,

  PRIMARY KEY(uuid)
);
