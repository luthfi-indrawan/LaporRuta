# API Contract - LaporRuta

## 1. Global Configuration Network

### 1.1 Base URLs

| Environment | Base URL                    |
| ----------- | --------------------------- |
| Development | `http://localhost:8080/api` |

### 1.2 Global Headers

| Header       | Value              | Required | Description                          |
| ------------ | ------------------ | -------- | ------------------------------------ |
| Content-Type | `application/json` | yes      | request body format                  |
| Accept       | `application/json` | yes      | response format                      |
| X-Request-ID | UUID               | no       | trace ID untuk logging dan debugging |

### 1.3 Response Format

#### Success Response

##### Generic

```json
{
  "code": 200, // int
  "message": "successfully", // string
  "result": {} // interface atau object
}
```

##### Pagination & Metadata

```json
{
  "code": 200, // int
  "message": "successfully", // string
  "result": {
    "data": [], // array
    "metadata": {
      "current_page": 1, // int
      "page_size": 20, // int
      "total_pages": 5, // int
      "total_items": 98, // int
      "has_next_page": true, // boolean
      "has_prev_page": false // boolean
    }
  }
}
```

## 2. List HTTP Service

- 