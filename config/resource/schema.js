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
    },
    "do": {
      "id": "do",
      "type": "string",
      "name": "do",
      "default": "/",
      "description": "[Auto Generator], if action: '/user/vip/' when pid == 0 is '/', " +
      "if action: '/user/vip/put' when pid > 0 is '/put'"
    },
    "base": {
      "id": "base",
      "type": "string",
      "name": "base",
      "default": "",
      "description": "[Auto Generator] Top Level Action, when pid == 0 is ''"
    },
    "baseId": {
      "id": "baseId",
      "type": "integer",
      "name": "baseId",
      "default": "",
      "description": "[Auto Generator] Top Level ID, when pid == 0 is Resource ID"
    }
  },
  "required": [
    "id",
    "name",
    "pid",
    "type",
    "method",
    "action",
    "do"
  ]
};
