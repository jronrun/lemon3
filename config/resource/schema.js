module.exports = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "id": "/",
  "type": "object",
  "properties": {
    "id": {
      "id": "id",
      "type": "integer",
      "name": "id",
      "description": "Resource Unique ID"
    },
    "name": {
      "id": "name",
      "type": "string",
      "name": "name",
      "description": "Resource Name"
    },
    "pid": {
      "id": "pid",
      "type": "integer",
      "name": "pid",
      "description": "Parent Resource Unique ID",
      "default": "0"
    },
    "action": {
      "id": "action",
      "type": "string",
      "name": "action",
      "default": "/",
      "description": "Resource URI"
    },
    "type": {
      "id": "type",
      "type": "string",
      "name": "type",
      "description": "Resource Type, Default is Type.URL",
      "default": "URL"
    },
    "method": {
      "id": "method",
      "type": "string",
      "name": "method",
      "default": "GET",
      "description": "HTTP Method, Default is Method.GET"
    },
    "children": {
      "id": "children",
      "type": "array",
      "name": "children",
      "description": "Children Resource",
      "additionalItems": false
    }
  },
  "required": [
    "id",
    "name",
    "pid",
    "type",
    "method",
    "action"
  ]
};
