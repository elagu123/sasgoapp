# 🔗 SASGOAPP API Reference

## Overview
The SASGOAPP REST API provides endpoints for managing travel plans, user authentication, real-time collaboration, and AI-powered recommendations. All API endpoints require authentication unless otherwise specified.

## Base URL
```
Development: http://localhost:3001/api
Production: https://api.sasgoapp.com/api
```

## Authentication
The API uses JWT (JSON Web Tokens) with access and refresh token pattern:
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
X-CSRF-Token: <csrf_token>
```

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-09-09T10:00:00Z"
  },
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOi...",
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOi..."
}
```

### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "preferences": {
      "travelStyle": "balanced",
      "preferredCategories": ["adventure", "culture"]
    }
  },
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOi...",
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOi..."
}
```

### Get Current User
```http
GET /auth/me
```

**Response:**
```json
{
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "preferences": {
      "travelStyle": "balanced",
      "preferredCategories": ["adventure", "culture"]
    },
    "createdAt": "2024-09-09T10:00:00Z"
  }
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOi..."
}
```

**Response:**
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOi...",
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOi..."
}
```

## 🧳 Trip Management Endpoints

### List Trips
```http
GET /trips
```

**Query Parameters:**
- `status` (optional): `upcoming`, `ongoing`, `completed`
- `limit` (optional): Number of trips to return (default: 10)
- `offset` (optional): Number of trips to skip (default: 0)

**Response:**
```json
{
  "trips": [
    {
      "id": "trip123",
      "title": "European Adventure",
      "destination": ["Paris, France", "Rome, Italy"],
      "dates": {
        "start": "2024-10-15",
        "end": "2024-10-22"
      },
      "travelers": 2,
      "budget": 3000,
      "pace": "moderate",
      "interests": ["culture", "food", "history"],
      "members": [
        {
          "id": "user123",
          "name": "John Doe",
          "role": "OWNER"
        }
      ],
      "createdAt": "2024-09-09T10:00:00Z",
      "privacy": "private"
    }
  ],
  "total": 1
}
```

### Create Trip
```http
POST /trips
```

**Request Body:**
```json
{
  "title": "European Adventure",
  "destination": ["Paris, France", "Rome, Italy"],
  "dates": {
    "start": "2024-10-15",
    "end": "2024-10-22"
  },
  "travelers": 2,
  "budget": 3000,
  "pace": "moderate",
  "interests": ["culture", "food", "history"],
  "privacy": "private"
}
```

**Response:**
```json
{
  "trip": {
    "id": "trip123",
    "title": "European Adventure",
    "destination": ["Paris, France", "Rome, Italy"],
    "dates": {
      "start": "2024-10-15",
      "end": "2024-10-22"
    },
    "travelers": 2,
    "budget": 3000,
    "pace": "moderate",
    "interests": ["culture", "food", "history"],
    "members": [
      {
        "id": "user123",
        "name": "John Doe",
        "role": "OWNER"
      }
    ],
    "createdAt": "2024-09-09T10:00:00Z",
    "privacy": "private"
  }
}
```

### Get Trip Details
```http
GET /trips/:id
```

**Response:**
```json
{
  "trip": {
    "id": "trip123",
    "title": "European Adventure",
    "destination": ["Paris, France", "Rome, Italy"],
    "dates": {
      "start": "2024-10-15",
      "end": "2024-10-22"
    },
    "travelers": 2,
    "budget": 3000,
    "pace": "moderate",
    "interests": ["culture", "food", "history"],
    "members": [
      {
        "id": "user123",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "OWNER"
      }
    ],
    "itinerary": {
      "days": [
        {
          "date": "2024-10-15",
          "dayIndex": 1,
          "blocks": [
            {
              "id": "block123",
              "title": "Arrival in Paris",
              "startTime": "09:00",
              "endTime": "12:00",
              "description": "Land at CDG Airport and check into hotel",
              "type": "transport"
            }
          ]
        }
      ]
    },
    "packingListId": "packing123",
    "expenses": 1250.50,
    "createdAt": "2024-09-09T10:00:00Z"
  }
}
```

### Update Trip
```http
PUT /trips/:id
```

**Request Body:**
```json
{
  "title": "Updated European Adventure",
  "budget": 3500,
  "interests": ["culture", "food", "history", "art"]
}
```

### Delete Trip
```http
DELETE /trips/:id
```

**Response:**
```json
{
  "message": "Trip deleted successfully"
}
```

### Share Trip
```http
POST /trips/:id/share
```

**Request Body:**
```json
{
  "email": "friend@example.com",
  "permissionLevel": "EDITOR"
}
```

**Response:**
```json
{
  "invitation": {
    "id": "invite123",
    "tripId": "trip123",
    "email": "friend@example.com",
    "permissionLevel": "EDITOR",
    "status": "pending",
    "createdAt": "2024-09-09T10:00:00Z"
  }
}
```

## 💰 Expense Management Endpoints

### List Expenses
```http
GET /expenses
```

**Query Parameters:**
- `tripId` (optional): Filter expenses by trip
- `category` (optional): Filter by expense category
- `startDate` (optional): Filter expenses from date
- `endDate` (optional): Filter expenses to date

**Response:**
```json
{
  "expenses": [
    {
      "id": "expense123",
      "tripId": "trip123",
      "description": "Hotel Paris",
      "amount": 150.00,
      "category": "alojamiento",
      "date": "2024-10-15",
      "createdBy": "user123",
      "createdAt": "2024-10-15T14:30:00Z"
    }
  ],
  "total": 150.00
}
```

### Create Expense
```http
POST /expenses
```

**Request Body:**
```json
{
  "tripId": "trip123",
  "description": "Hotel Paris",
  "amount": 150.00,
  "category": "alojamiento",
  "date": "2024-10-15"
}
```

### Update Expense
```http
PUT /expenses/:id
```

**Request Body:**
```json
{
  "description": "Hotel Paris - Updated",
  "amount": 175.00,
  "category": "alojamiento"
}
```

### Delete Expense
```http
DELETE /expenses/:id
```

## 🎒 Packing List Endpoints

### Get Packing List
```http
GET /packing/:id
```

**Response:**
```json
{
  "packingList": {
    "id": "packing123",
    "tripId": "trip123",
    "title": "European Adventure Packing",
    "items": [
      {
        "id": "item123",
        "name": "Passport",
        "category": "documents",
        "quantity": 1,
        "packed": true,
        "essential": true
      },
      {
        "id": "item124",
        "name": "Comfortable Walking Shoes",
        "category": "clothing",
        "quantity": 1,
        "packed": false,
        "essential": true
      }
    ],
    "progress": {
      "total": 25,
      "packed": 12
    },
    "createdAt": "2024-09-09T10:00:00Z"
  }
}
```

### Create Packing List
```http
POST /packing-lists
```

**Request Body:**
```json
{
  "tripId": "trip123",
  "title": "European Adventure Packing",
  "useTemplate": "europe-city-break"
}
```

### Update Packing List
```http
PATCH /packing/:id
```

**Request Body:**
```json
{
  "operations": [
    {
      "type": "toggle",
      "itemId": "item123"
    },
    {
      "type": "add",
      "item": {
        "name": "Travel Insurance",
        "category": "documents",
        "quantity": 1,
        "essential": true
      }
    }
  ]
}
```

## 🤖 AI Recommendations Endpoints

### Get Itinerary Suggestions
```http
POST /ai/itinerary
```

**Request Body:**
```json
{
  "tripId": "trip123",
  "preferences": {
    "pace": "moderate",
    "interests": ["culture", "food"],
    "budget": "medium"
  }
}
```

**Response:**
```json
{
  "suggestions": {
    "days": [
      {
        "date": "2024-10-15",
        "dayIndex": 1,
        "theme": "Arrival & City Center",
        "blocks": [
          {
            "title": "Check-in & Rest",
            "startTime": "09:00",
            "endTime": "11:00",
            "type": "accommodation",
            "description": "Check into hotel and freshen up"
          },
          {
            "title": "Notre-Dame Cathedral",
            "startTime": "11:30",
            "endTime": "13:00",
            "type": "activity",
            "description": "Explore the iconic cathedral and surrounding area",
            "coords": {
              "lat": 48.8530,
              "lng": 2.3499
            }
          }
        ]
      }
    ],
    "totalEstimatedCost": 2800,
    "tips": [
      "Consider purchasing a Paris Museum Pass",
      "Book dinner reservations in advance"
    ]
  }
}
```

### Get Packing Suggestions
```http
POST /ai/packing
```

**Request Body:**
```json
{
  "tripId": "trip123",
  "destination": ["Paris, France"],
  "dates": {
    "start": "2024-10-15",
    "end": "2024-10-22"
  },
  "activities": ["sightseeing", "dining", "walking"]
}
```

**Response:**
```json
{
  "suggestions": {
    "essentials": [
      {
        "name": "Passport",
        "category": "documents",
        "reason": "Required for international travel"
      },
      {
        "name": "Comfortable Walking Shoes",
        "category": "clothing",
        "reason": "Lots of walking on cobblestone streets"
      }
    ],
    "weatherBased": [
      {
        "name": "Light Rain Jacket",
        "category": "clothing",
        "reason": "October weather can be unpredictable"
      }
    ],
    "tips": [
      "Pack layers for variable October weather",
      "Bring a portable phone charger for navigation"
    ]
  }
}
```

## 📍 Real-time Collaboration

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:3001');

// Join a trip room
ws.send(JSON.stringify({
  type: 'join',
  tripId: 'trip123',
  token: 'your_jwt_token'
}));

// Send updates
ws.send(JSON.stringify({
  type: 'update',
  tripId: 'trip123',
  operation: {
    type: 'itinerary',
    action: 'add_block',
    data: {
      dayIndex: 1,
      block: {
        title: 'Lunch at Cafe',
        startTime: '12:00',
        endTime: '13:30'
      }
    }
  }
}));
```

## 📊 Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-09-09T10:00:00Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR` (400) - Invalid input data
- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict (e.g., duplicate email)
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

## 🔒 Rate Limiting

The API implements rate limiting to prevent abuse:
- **Authentication endpoints**: 5 requests per minute per IP
- **General API**: 100 requests per minute per user
- **AI endpoints**: 10 requests per minute per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1628097600
```

## 📝 Request/Response Examples

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Create Trip:**
```bash
curl -X POST http://localhost:3001/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Weekend Getaway",
    "destination": ["Barcelona, Spain"],
    "dates": {
      "start": "2024-10-20",
      "end": "2024-10-22"
    },
    "budget": 800,
    "travelers": 2
  }'
```

## 🔄 Changelog

### Version 1.0.0 (Current)
- Initial API release
- Authentication with JWT
- Trip CRUD operations
- Expense management
- Packing list management
- Real-time collaboration
- AI-powered recommendations

---

For more information, see the [main README](../README.md) or contact support at agsasmoda@gmail.com.