# AMC (Annual Maintenance Contract) Page Documentation

## Overview
The AMC page provides a comprehensive interface for managing Annual Maintenance Contracts in the car service application. It includes full CRUD operations, role-based access control, and advanced features for superadmin and admin users.

## Features

### 🔐 Role-Based Access Control
- **Superadmin**: Full access to all AMC operations
- **Admin**: Full access to all AMC operations
- **User**: View-only access to their own AMC records

### 📊 Data Management
- **Create AMC**: Add new AMC records with multiple years of maintenance
- **Read AMC**: View all AMC records with detailed information
- **Update AMC**: Modify existing AMC records and payment status
- **Delete AMC**: Remove AMC records (admin/superadmin only)

### 🔍 Search and Filtering
- **Search**: Filter by user name, car name, or ticket ID
- **Status Filter**: Filter by payment status (Paid, Partial, Unpaid)
- **Year Filter**: Filter by specific years
- **Real-time filtering**: Instant results as you type

### 📄 Pagination
- **Configurable page size**: 10 items per page (default)
- **Navigation controls**: Previous/Next buttons and page numbers
- **Responsive design**: Works on all screen sizes

### 💰 Payment Management
- **Payment status tracking**: Track payment status for each year
- **Quick payment updates**: Toggle payment status directly from the table
- **Payment history**: View detailed payment information
- **Amount calculations**: Automatic calculation of total, paid, and pending amounts

### 📤 Export Functionality
- **CSV Export**: Export filtered data to CSV format
- **Excel Export**: Export data in Excel-compatible format
- **Comprehensive data**: Includes all relevant AMC information

## Technical Implementation

### Component Structure
```
amc/
├── amc.ts          # Main component logic
├── amc.html        # Template with forms and tables
├── amc.css         # Styling and responsive design
└── amc.spec.ts     # Unit tests
```

### Services Used
- **AmcService**: Handles all AMC-related API calls
- **UserService**: Manages user data for dropdowns
- **CarService**: Manages car data for selection
- **TicketService**: Manages ticket data for association

### Key Interfaces
```typescript
interface AMC {
  _id?: string;
  userid: string | User;
  carid: string | Car;
  ticketid: string | Ticket;
  amcamount: AMCAmount[];
  createdAt?: string;
  updatedAt?: string;
}

interface AMCAmount {
  year: number;
  amount: number;
  paid: boolean;
  duedate?: string;
  paiddate?: string;
  penality: number;
}
```

## API Endpoints

### AMC Operations
- `GET /api/amcs` - Get all AMC records
- `POST /api/amcs` - Create new AMC record
- `GET /api/amcs/:id` - Get specific AMC record
- `PUT /api/amcs/:id` - Update AMC record
- `DELETE /api/amcs/:id` - Delete AMC record
- `PUT /api/amcs/:id/payment-status` - Update payment status

### Authentication
All endpoints require authentication via Bearer token in the Authorization header.

## User Interface

### Main Table
- **User Information**: Name and contact details
- **Car Details**: Brand, model, and specifications
- **Ticket Information**: Ticket ID and pricing
- **AMC Years**: List of years covered
- **Financial Summary**: Total, paid, and pending amounts
- **Payment Status**: Visual indicators for payment status
- **Actions**: Edit, delete, and payment status updates

### Create/Edit Form
- **User Selection**: Dropdown with all users
- **Car Selection**: Dropdown with all available cars
- **Ticket Selection**: Dropdown with all tickets
- **AMC Amounts**: Dynamic form for multiple years
  - Year selection
  - Amount input
  - Penalty amount
  - Payment status checkbox
- **Form Validation**: Client-side validation for all fields

### Search and Filters
- **Search Bar**: Real-time search across multiple fields
- **Status Filter**: Dropdown for payment status
- **Year Filter**: Dropdown for specific years
- **Export Buttons**: CSV and Excel export options

## Responsive Design

### Desktop (1024px+)
- Full table with all columns visible
- Side-by-side form layout
- Complete pagination controls

### Tablet (768px - 1023px)
- Condensed table layout
- Stacked form elements
- Simplified pagination

### Mobile (< 768px)
- Horizontal scrolling table
- Full-width form elements
- Touch-friendly buttons

## Error Handling

### Client-Side Validation
- Required field validation
- Numeric input validation
- Date range validation
- Form submission prevention for invalid data

### Server Error Handling
- API error messages display
- Network error handling
- Loading states during operations
- Success/error notifications

## Performance Optimizations

### Data Loading
- Parallel API calls for initial data load
- Lazy loading of related data
- Efficient pagination to reduce data transfer

### UI Optimizations
- Virtual scrolling for large datasets
- Debounced search input
- Optimized change detection
- Minimal re-renders

## Security Features

### Role-Based Access
- Component-level access control
- API-level permission checks
- UI element visibility based on roles

### Data Validation
- Client-side input validation
- Server-side data validation
- XSS protection in templates

## Usage Examples

### Creating an AMC
1. Click "Add AMC" button
2. Select user from dropdown
3. Select car from dropdown
4. Select ticket from dropdown
5. Add AMC amounts for each year
6. Set payment status for each year
7. Click "Create AMC"

### Updating Payment Status
1. Find the AMC record in the table
2. Click the payment status button (✓ or ✗) for the desired year
3. The status will update immediately

### Exporting Data
1. Apply any desired filters
2. Click "Export CSV" or "Export Excel"
3. File will download automatically

## Future Enhancements

### Planned Features
- **Bulk Operations**: Select multiple AMCs for batch operations
- **Advanced Filters**: Date range, amount range, and custom filters
- **Email Notifications**: Automated payment reminders
- **Reports**: Detailed financial reports and analytics
- **Audit Trail**: Track all changes to AMC records

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live updates
- **Offline Support**: PWA capabilities for offline access
- **Advanced Search**: Full-text search with Elasticsearch
- **Data Visualization**: Charts and graphs for AMC analytics

## Troubleshooting

### Common Issues
1. **Data not loading**: Check authentication and network connection
2. **Form validation errors**: Ensure all required fields are filled
3. **Export not working**: Check browser popup blockers
4. **Permission denied**: Verify user role and permissions

### Debug Information
- Check browser console for error messages
- Verify API endpoints are accessible
- Confirm user authentication status
- Check network tab for failed requests

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
