# Most Browsed Cars Feature

## Overview
The Most Browsed Cars feature tracks how many times users view individual cars and displays the most popular cars to help users discover trending vehicles.

## Backend Implementation

### Database Changes
- Added `viewCount` field to the Car model (Number, default: 0)
- Added database indexes for efficient querying:
  - `{ viewCount: -1 }` - For most browsed cars queries
  - `{ status: 1, viewCount: -1 }` - For most browsed active cars

### API Endpoints

#### 1. Track Car View
- **Endpoint**: `POST /api/cars/public/:id/view`
- **Purpose**: Increments the view count for a specific car
- **Parameters**: 
  - `id` (URL parameter): Car ID
- **Response**: 
  ```json
  {
    "status": "success",
    "body": {
      "car": {
        "_id": "car_id",
        "viewCount": 42
      }
    },
    "message": "Car view tracked successfully"
  }
  ```

#### 2. Get Most Browsed Cars
- **Endpoint**: `GET /api/cars/public/most-browsed`
- **Purpose**: Retrieves cars sorted by view count (most browsed first)
- **Query Parameters**:
  - `limit` (optional): Number of cars to return (default: 10)
- **Response**:
  ```json
  {
    "status": "success",
    "body": {
      "cars": [
        {
          "_id": "car_id",
          "carname": "Car Model",
          "brandname": "Brand",
          "viewCount": 150,
          // ... other car fields
        }
      ]
    },
    "message": "Most browsed cars retrieved successfully"
  }
  ```

## Frontend Implementation

### Service Methods
- `trackCarView(id: string)`: Tracks a car view
- `getMostBrowsedCars(limit?: number)`: Fetches most browsed cars

### UI Components

#### 1. Most Browsed Cars Section
- Toggleable section on the cars page
- Shows up to 6 most browsed cars
- Each car card displays:
  - "Most Browsed" badge (purple gradient)
  - View count badge (orange)
  - Standard car information
  - Details button with view tracking

#### 2. Sort Option
- Added "Most Browsed" option to the sort dropdown
- Sorts all cars by view count in descending order

#### 3. View Tracking
- Automatically tracks views when users click "Details" on any car
- Non-blocking: navigation continues even if tracking fails

## Usage

### For Users
1. Browse cars on the cars page
2. Click "Show Most Browsed" to see popular cars
3. Use "Most Browsed" sort option to see all cars by popularity
4. Clicking "Details" on any car automatically tracks the view

### For Developers
1. View counts are automatically incremented when users view car details
2. Most browsed cars are filtered to show only active cars (not cancelled, not stopped bookings)
3. The feature is non-intrusive and doesn't affect existing functionality

## Testing

Run the test script to verify functionality:
```bash
cd backend
node test-most-browsed.js
```

This will:
1. Check if viewCount field exists
2. Add sample view counts to cars
3. Test the most browsed cars query
4. Test view tracking functionality

## Database Indexes

The following indexes were added for optimal performance:
- `{ viewCount: -1 }` - For sorting by view count
- `{ status: 1, viewCount: -1 }` - For filtering active cars by view count

## Future Enhancements

Potential improvements:
1. Time-based view tracking (views per day/week/month)
2. User-specific view history
3. Analytics dashboard for admins
4. View count decay over time
5. Integration with recommendation engine
