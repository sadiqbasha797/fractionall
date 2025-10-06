import { Component, OnInit, OnDestroy, ChangeDetectorRef, Renderer2, Injector, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { CarService, Car } from '../services/car.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ExportService, ExportOptions } from '../services/export.service';
import { PincodeService } from '../services/pincode.service';
import { LoadingDialogComponent } from '../shared/loading-dialog/loading-dialog.component';

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, LoadingDialogComponent],
  templateUrl: './cars.html',
  styleUrl: './cars.css'
})
export class Cars implements OnInit, OnDestroy {
  cars: Car[] = [];
  filteredCars: Car[] = [];
  totalCars: number = 0;
  selectedCar: Car | null = null;
  currentImageIndex: number = 0;
  searchTerm: string = '';
  statusFilter: string = 'all';
  brandFilter: string = 'all';
  locationFilter: string = 'all';
  bookingsFilter: string = 'all';
  uniqueBrands: string[] = [];
  uniqueLocations: string[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Helper method for template
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }
  newCar: Car = {
    carname: '',
    color: '',
    milege: '',
    seating: 0,
    features: [],
    brandname: '',
    price: 0,
    fractionprice: 0,
    tokenprice: 0,
    expectedpurchasedate: '',
    ticketsavilble: 0,
    totaltickets: 0,
    tokensavailble: 0,
    bookNowTokenAvailable: 0,
    bookNowTokenPrice: 0,
    amcperticket: 0,
    contractYears: 5,
    location: '',
    pincode: '',
    description: '',
    images: [],
    createdBy: '', // This will be set by the backend based on the authenticated user
    createdByModel: '', // This will be set by the backend based on the authenticated user
    stopBookings: false
  };

  // Check if bookings can be enabled (both tokens must have availability)
  canEnableBookings(): boolean {
    return (this.newCar.tokensavailble > 0) || (this.newCar.bookNowTokenAvailable > 0);
  }

  // Handle token availability changes
  onTokenAvailabilityChange(): void {
    // If both tokens are 0, automatically set stopBookings to true
    if (this.newCar.tokensavailble === 0 && this.newCar.bookNowTokenAvailable === 0) {
      this.newCar.stopBookings = true;
    }
  }

  // Validate input values against maximum limits
  validateInputs(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate waitlist tokens (max 20)
    if (this.newCar.tokensavailble > 20) {
      errors.push('Waitlist tokens cannot exceed 20');
    }

    // Validate book now tokens (max 12)
    if (this.newCar.bookNowTokenAvailable > 12) {
      errors.push('Book now tokens cannot exceed 12');
    }

    // Validate total tickets/shares (max 12)
    if (this.newCar.totaltickets > 12) {
      errors.push('Total tickets/shares cannot exceed 12');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Handle input changes with validation
  onWaitlistTokensChange(): void {
    if (this.newCar.tokensavailble > 20) {
      this.newCar.tokensavailble = 20;
    }
    this.onTokenAvailabilityChange();
  }

  onBookNowTokensChange(): void {
    if (this.newCar.bookNowTokenAvailable > 12) {
      this.newCar.bookNowTokenAvailable = 12;
    }
    this.onTokenAvailabilityChange();
  }

  onTotalTicketsChange(): void {
    if (this.newCar.totaltickets > 12) {
      this.newCar.totaltickets = 12;
    }
  }
  isEditMode: boolean = false;
  currentCarId: string | null = null;
  selectedFiles: File[] = [];

  // Dialog states
  showDialog: boolean = false;
  showCarModal: boolean = false;
  
  // Loading dialog
  showLoadingDialog: boolean = false;
  loadingMessage: string = '';

  // Pincode and location auto-fill properties
  isPincodeLoading: boolean = false;
  pincodeError: string = '';
  pincodeTimeout: any;

  private dialogElement: HTMLElement | null = null;

  constructor(
    private carService: CarService,
    private exportService: ExportService,
    private pincodeService: PincodeService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.getCars();
    this.checkFontAwesomeLoaded();
  }

  ngOnDestroy(): void {
    // Clean up timeout when component is destroyed
    if (this.pincodeTimeout) {
      clearTimeout(this.pincodeTimeout);
    }
  }  
  
  // Dialog methods - Render directly to body
  showConfirmDialog(title: string, message: string, confirmCallback: () => void): void {
    console.log('showConfirmDialog called - Rendering to BODY');
    
    // Remove any existing dialog
    this.removeDialog();
    
    // Create dialog backdrop
    const backdrop = this.renderer.createElement('div');
    this.renderer.setStyle(backdrop, 'position', 'fixed');
    this.renderer.setStyle(backdrop, 'top', '0');
    this.renderer.setStyle(backdrop, 'left', '0');
    this.renderer.setStyle(backdrop, 'width', '100vw');
    this.renderer.setStyle(backdrop, 'height', '100vh');
    this.renderer.setStyle(backdrop, 'background', 'rgba(0, 0, 0, 0.8)');
    this.renderer.setStyle(backdrop, 'z-index', '999999');
    this.renderer.setStyle(backdrop, 'display', 'flex');
    this.renderer.setStyle(backdrop, 'align-items', 'center');
    this.renderer.setStyle(backdrop, 'justify-content', 'center');
    
    // Create dialog box
    const dialog = this.renderer.createElement('div');
    this.renderer.setStyle(dialog, 'background', '#374151');
    this.renderer.setStyle(dialog, 'border-radius', '12px');
    this.renderer.setStyle(dialog, 'max-width', '500px');
    this.renderer.setStyle(dialog, 'width', '90%');
    this.renderer.setStyle(dialog, 'padding', '24px');
    
    // Title
    const titleEl = this.renderer.createElement('h3');
    this.renderer.setStyle(titleEl, 'color', 'white');
    this.renderer.setStyle(titleEl, 'margin', '0 0 16px 0');
    this.renderer.setStyle(titleEl, 'font-size', '1.5rem');
    const titleText = this.renderer.createText(title);
    this.renderer.appendChild(titleEl, titleText);
    
    // Message
    const messageEl = this.renderer.createElement('div');
    this.renderer.setProperty(messageEl, 'innerHTML', message);
    this.renderer.setStyle(messageEl, 'color', '#E5E7EB');
    this.renderer.setStyle(messageEl, 'margin-bottom', '24px');
    
    // Buttons
    const btnContainer = this.renderer.createElement('div');
    this.renderer.setStyle(btnContainer, 'display', 'flex');
    this.renderer.setStyle(btnContainer, 'justify-content', 'flex-end');
    this.renderer.setStyle(btnContainer, 'gap', '12px');
    
    const cancelBtn = this.renderer.createElement('button');
    const cancelText = this.renderer.createText('Cancel');
    this.renderer.appendChild(cancelBtn, cancelText);
    this.renderer.setStyle(cancelBtn, 'background', '#6B7280');
    this.renderer.setStyle(cancelBtn, 'color', 'white');
    this.renderer.setStyle(cancelBtn, 'border', 'none');
    this.renderer.setStyle(cancelBtn, 'padding', '10px 20px');
    this.renderer.setStyle(cancelBtn, 'border-radius', '8px');
    this.renderer.setStyle(cancelBtn, 'cursor', 'pointer');
    this.renderer.listen(cancelBtn, 'click', () => this.removeDialog());
    
    const confirmBtn = this.renderer.createElement('button');
    const confirmText = this.renderer.createText('Confirm');
    this.renderer.appendChild(confirmBtn, confirmText);
    this.renderer.setStyle(confirmBtn, 'background', '#DC2626');
    this.renderer.setStyle(confirmBtn, 'color', 'white');
    this.renderer.setStyle(confirmBtn, 'border', 'none');
    this.renderer.setStyle(confirmBtn, 'padding', '10px 20px');
    this.renderer.setStyle(confirmBtn, 'border-radius', '8px');
    this.renderer.setStyle(confirmBtn, 'cursor', 'pointer');
    this.renderer.listen(confirmBtn, 'click', () => {
      this.removeDialog();
      confirmCallback();
    });
    
    this.renderer.appendChild(btnContainer, cancelBtn);
    this.renderer.appendChild(btnContainer, confirmBtn);
    this.renderer.appendChild(dialog, titleEl);
    this.renderer.appendChild(dialog, messageEl);
    this.renderer.appendChild(dialog, btnContainer);
    this.renderer.appendChild(backdrop, dialog);
    
    // Append to document.body
    this.renderer.appendChild(document.body, backdrop);
    this.dialogElement = backdrop;
    
    console.log('✅ Dialog APPENDED TO BODY:', backdrop);
    
    this.renderer.listen(dialog, 'click', (e: Event) => e.stopPropagation());
    this.renderer.listen(backdrop, 'click', () => this.removeDialog());
  }
  
  removeDialog(): void {
    if (this.dialogElement) {
      this.renderer.removeChild(document.body, this.dialogElement);
      this.dialogElement = null;
    }
  }

  showSuccessDialog(message: string): void {
    this.showMessageDialog('Success', message, '#10B981'); // Green
  }

  showErrorDialog(message: string): void {
    this.showMessageDialog('Error', message, '#DC2626'); // Red
  }

  showWarningDialog(message: string): void {
    this.showMessageDialog('Warning', message, '#F59E0B'); // Orange
  }

  showMessageDialog(title: string, message: string, color: string): void {
    this.removeDialog();
    
    const backdrop = this.renderer.createElement('div');
    this.renderer.setStyle(backdrop, 'position', 'fixed');
    this.renderer.setStyle(backdrop, 'top', '0');
    this.renderer.setStyle(backdrop, 'left', '0');
    this.renderer.setStyle(backdrop, 'width', '100vw');
    this.renderer.setStyle(backdrop, 'height', '100vh');
    this.renderer.setStyle(backdrop, 'background', 'rgba(0, 0, 0, 0.8)');
    this.renderer.setStyle(backdrop, 'z-index', '999999');
    this.renderer.setStyle(backdrop, 'display', 'flex');
    this.renderer.setStyle(backdrop, 'align-items', 'center');
    this.renderer.setStyle(backdrop, 'justify-content', 'center');
    
    const dialog = this.renderer.createElement('div');
    this.renderer.setStyle(dialog, 'background', '#374151');
    this.renderer.setStyle(dialog, 'border-radius', '12px');
    this.renderer.setStyle(dialog, 'max-width', '400px');
    this.renderer.setStyle(dialog, 'width', '90%');
    this.renderer.setStyle(dialog, 'padding', '24px');
    this.renderer.setStyle(dialog, 'text-align', 'center');
    
    const titleEl = this.renderer.createElement('h3');
    this.renderer.setStyle(titleEl, 'color', color);
    this.renderer.setStyle(titleEl, 'margin', '0 0 16px 0');
    this.renderer.setStyle(titleEl, 'font-size', '1.5rem');
    this.renderer.setStyle(titleEl, 'font-weight', '600');
    const titleText = this.renderer.createText(title);
    this.renderer.appendChild(titleEl, titleText);
    
    const messageEl = this.renderer.createElement('div');
    this.renderer.setProperty(messageEl, 'innerHTML', message);
    this.renderer.setStyle(messageEl, 'color', '#E5E7EB');
    this.renderer.setStyle(messageEl, 'margin-bottom', '24px');
    
    const okBtn = this.renderer.createElement('button');
    const okText = this.renderer.createText('OK');
    this.renderer.appendChild(okBtn, okText);
    this.renderer.setStyle(okBtn, 'background', color);
    this.renderer.setStyle(okBtn, 'color', 'white');
    this.renderer.setStyle(okBtn, 'border', 'none');
    this.renderer.setStyle(okBtn, 'padding', '10px 30px');
    this.renderer.setStyle(okBtn, 'border-radius', '8px');
    this.renderer.setStyle(okBtn, 'cursor', 'pointer');
    this.renderer.setStyle(okBtn, 'font-size', '14px');
    this.renderer.setStyle(okBtn, 'font-weight', '600');
    this.renderer.listen(okBtn, 'click', () => this.removeDialog());
    
    this.renderer.appendChild(dialog, titleEl);
    this.renderer.appendChild(dialog, messageEl);
    this.renderer.appendChild(dialog, okBtn);
    this.renderer.appendChild(backdrop, dialog);
    this.renderer.appendChild(document.body, backdrop);
    this.dialogElement = backdrop;
    
    this.renderer.listen(backdrop, 'click', () => this.removeDialog());
    this.renderer.listen(dialog, 'click', (e: Event) => e.stopPropagation());
  }

  closeDialog(): void {
    this.showDialog = false;
  }

  confirmDialog(): void {
    this.showDialog = false;
  }

  cancelDialog(): void {
    this.showDialog = false;
  }

  checkFontAwesomeLoaded(): void {
    // Check if Font Awesome is loaded by testing if the CSS is available
    setTimeout(() => {
      const testElement = document.createElement('i');
      testElement.className = 'fas fa-search';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);

      const computedStyle = window.getComputedStyle(testElement, ':before');
      const fontFamily = computedStyle.getPropertyValue('font-family');

      document.body.removeChild(testElement);

      const searchContainer = document.querySelector('.search-input-container');
      if (searchContainer) {
        if (fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome')) {
          searchContainer.classList.add('fa-loaded');
        } else {
          searchContainer.classList.remove('fa-loaded');
        }
      }
    }, 100);
  }

  getCars(): void {
    this.carService.getCars().subscribe((response) => {
      if (response.status === 'success') {
        this.cars = response.body.cars;
        this.filteredCars = [...this.cars];
        this.totalCars = this.cars.length;
        this.extractUniqueBrands();
        this.extractUniqueLocations();
        // Initialize pagination after loading cars
        this.applyFilters();
      } else {
        console.error('Failed to get cars:', response.message);
      }
    });
  }

  extractUniqueBrands(): void {
    this.uniqueBrands = [...new Set(this.cars.map(car => car.brandname?.trim()).filter(brand => brand))];
  }

  extractUniqueLocations(): void {
    this.uniqueLocations = [...new Set(this.cars.map(car => car.location?.trim()).filter(location => location))];
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onBrandFilterChange(): void {
    this.applyFilters();
  }

  onLocationFilterChange(): void {
    this.applyFilters();
  }

  onBookingsFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredCars = this.cars.filter(car => {
      const matchesSearch = !this.searchTerm ||
        car.carname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        car.brandname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        car.status?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        car.location?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        car.pincode?.includes(this.searchTerm);

      const matchesStatus = this.statusFilter === 'all' || car.status === this.statusFilter;
      const matchesBrand = this.brandFilter === 'all' || car.brandname === this.brandFilter;
      const matchesLocation = this.locationFilter === 'all' || car.location === this.locationFilter;
      const matchesBookings = this.bookingsFilter === 'all' ||
        (this.bookingsFilter === 'active' && !car.stopBookings) ||
        (this.bookingsFilter === 'stopped' && car.stopBookings);

      return matchesSearch && matchesStatus && matchesBrand && matchesLocation && matchesBookings;
    });

    // Update pagination
    this.totalPages = Math.ceil(this.filteredCars.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedCars(): Car[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCars.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.brandFilter = 'all';
    this.locationFilter = 'all';
    this.bookingsFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  viewCarDetails(car: Car): void {
    this.selectedCar = car;
    this.currentImageIndex = 0;
  }

  closeViewModal(): void {
    this.selectedCar = null;
    this.currentImageIndex = 0;
  }

  showCreateCarModal(): void {
    this.isEditMode = false;
    this.newCar = {
      carname: '',
      color: '',
      milege: '',
      seating: 0,
      features: [],
      brandname: '',
      price: 0,
      fractionprice: 0,
      tokenprice: 0,
      expectedpurchasedate: '',
      ticketsavilble: 0,
      totaltickets: 0,
      tokensavailble: 0,
      bookNowTokenAvailable: 0,
      bookNowTokenPrice: 0,
      amcperticket: 0,
      contractYears: 5,
      location: '',
      pincode: '',
      description: '',
      images: [],
      createdBy: '',
      createdByModel: '',
      stopBookings: false
    };
    this.showCarModal = true;
    console.log('✅ Car modal opened');
  }

  updateFeatures(event: any): void {
    this.newCar.features = event.split(',').map((s: string) => s.trim());
  }

  removeExistingImage(index: number): void {
    if (this.newCar.images && index >= 0 && index < this.newCar.images.length) {
      this.newCar.images.splice(index, 1);
    }
  }

  closeModal(): void {
    this.showCarModal = false;
    this.selectedFiles = [];
    console.log('✅ Car modal closed');
  }

  getTicketsProgress(car: Car): number {
    if (!car.totaltickets || car.totaltickets === 0) {
      return 0;
    }
    const sold = car.totaltickets - (car.ticketsavilble || 0);
    return (sold / car.totaltickets) * 100;
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
    }
  }

  clearFileInput(): void {
    const fileInput = document.getElementById('images') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  removeSelectedFile(index: number): void {
    if (this.selectedFiles && index >= 0 && index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
    }
  }

  submitCarForm(): void {
    // Validate inputs before submission
    const validation = this.validateInputs();
    if (!validation.isValid) {
      console.log('Validation errors:', validation.errors);
      this.showErrorDialog(validation.errors.join('\n'));
      return;
    }

    // Trim string values before creating form data
    const trimmedCarData = { ...this.newCar };
    const stringFields = ['carname', 'brandname', 'color', 'milege', 'location', 'pincode', 'description'];

    stringFields.forEach(field => {
      if (trimmedCarData[field as keyof Car] && typeof trimmedCarData[field as keyof Car] === 'string') {
        (trimmedCarData as any)[field] = (trimmedCarData[field as keyof Car] as string).trim();
      }
    });

    const formData = new FormData();

    for (const key in trimmedCarData) {
      if (Object.prototype.hasOwnProperty.call(trimmedCarData, key)) {
        const value = (trimmedCarData as any)[key];
        if (Array.isArray(value)) {
          // For features, ensure it's a comma-separated string if not empty
          if (key === 'features' && value.length > 0) {
            formData.append(key, value.join(','));
          } else if (key === 'images') {
            // For images array, send as JSON string for backend to parse
            formData.append(key, JSON.stringify(value));
          } else {
            value.forEach(item => formData.append(key, item));
          }
        } else if (value !== null && value !== undefined) {
          // Handle boolean values properly
          if (key === 'stopBookings') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value);
          }
        }
      }
    }

    // Append selected files (new uploads)
    this.selectedFiles.forEach(file => {
      formData.append('images', file, file.name);
    });

    this.showLoadingDialog = true;
    this.loadingMessage = this.isEditMode ? 'Updating car...' : 'Creating car...';

    if (this.isEditMode && this.currentCarId) {
      this.carService.updateCar(this.currentCarId, formData).subscribe({
        next: (response) => {
          this.showLoadingDialog = false;
          if (response.status === 'success') {
            this.getCars(); // Refresh the list
            this.closeModal();
            this.selectedFiles = []; // Clear selected files
            this.clearFileInput(); // Clear the file input
            // Show success modal after loading dialog is hidden
            setTimeout(() => {
              this.showSuccessDialog('Car updated successfully!');
            }, 300);
          } else {
            this.showErrorDialog(`Failed to update car: ${response.message}`);
          }
        },
        error: (err) => {
          this.showLoadingDialog = false;
          this.showErrorDialog(`Error updating car: ${err.message || 'Unknown error'}`);
        }
      });
    } else {
      this.carService.createCar(formData).subscribe({
        next: (response) => {
          this.showLoadingDialog = false;
          if (response.status === 'success') {
            this.getCars(); // Refresh the list
            this.closeModal();
            this.selectedFiles = []; // Clear selected files
            this.clearFileInput(); // Clear the file input
            // Show success modal after loading dialog is hidden
            setTimeout(() => {
              this.showSuccessDialog('Car created successfully!');
            }, 300);
          } else {
            this.showErrorDialog(`Failed to create car: ${response.message}`);
          }
        },
        error: (err) => {
          this.showLoadingDialog = false;
          this.showErrorDialog(`Error creating car: ${err.message || 'Unknown error'}`);
        }
      });
    }
  }

  editCar(car: Car): void {
    this.isEditMode = true;
    this.currentCarId = car._id!;
    this.newCar = { ...car }; // Copy car data to newCar for editing

    // Automatically set stopBookings to true if both tokens are 0
    if (this.newCar.tokensavailble === 0 && this.newCar.bookNowTokenAvailable === 0) {
      this.newCar.stopBookings = true;
    }

    this.showCarModal = true;
    console.log('✅ Edit car modal opened for:', car.carname);
  }

  deleteCar(car: Car): void {
    console.log('Attempting to delete car:', car.carname);
    console.log('Calling showConfirmDialog...');
      
    this.showConfirmDialog(
      'Confirm Delete',
      `Are you sure you want to delete <strong>${car.carname}</strong>? This action cannot be undone.`,
      () => this.executeCarDeletion(car)
    );
    
    console.log('After showConfirmDialog, showDialog:', this.showDialog);
  }

  private executeCarDeletion(car: Car): void {
    try {
      this.showLoadingDialog = true;
      this.loadingMessage = 'Deleting car...';

      this.carService.deleteCar(car._id!).subscribe({
        next: (response) => {
          this.showLoadingDialog = false;
          if (response.status === 'success') {
            this.cars = this.cars.filter(c => c._id !== car._id);
            this.applyFilters(); // Refresh filtered list
            // Show success modal after loading dialog is hidden
            setTimeout(() => {
              this.showSuccessDialog('Car deleted successfully!');
            }, 300);
          } else {
            this.showErrorDialog(`Failed to delete car: ${response.message}`);
          }
        },
        error: (err) => {
          this.showLoadingDialog = false;
          this.showErrorDialog(`Error deleting car: ${err.message || 'Unknown error'}`);
        }
      });
    } catch (error) {
      console.error('Error deleting car:', error);
    }
  }


  // Export functionality
  exportData() {
    this.exportToExcel();
  }

  exportToExcel() {
    const exportData = this.filteredCars.map(car => ({
      carName: car.carname,
      brandName: car.brandname,
      color: car.color,
      mileage: car.milege,
      seating: car.seating,
      price: car.price,
      fractionPrice: car.fractionprice,
      tokenPrice: car.tokenprice,
      totalTickets: car.totaltickets || 0,
      availableTickets: car.ticketsavilble || 0,
      soldTickets: (car.totaltickets || 0) - (car.ticketsavilble || 0),
      amcPerTicket: car.amcperticket,
      contractYears: car.contractYears,
      location: car.location || '',
      pincode: car.pincode || '',
      status: car.status || 'Active',
      description: car.description || '',
      features: Array.isArray(car.features) ? car.features.join(', ') : car.features || '',
      expectedPurchaseDate: car.expectedpurchasedate || '',
      tokensAvailable: car.tokensavailble || 0,
      bookNowTokenAvailable: car.bookNowTokenAvailable || 0,
      bookNowTokenPrice: car.bookNowTokenPrice || 0
    }));

    const options: ExportOptions = {
      filename: `cars-data-${new Date().toISOString().split('T')[0]}`,
      title: 'Cars Management Report',
      columns: [
        { header: 'Car Name', key: 'carName', width: 25 },
        { header: 'Brand', key: 'brandName', width: 20 },
        { header: 'Color', key: 'color', width: 15 },
        { header: 'Mileage', key: 'mileage', width: 15 },
        { header: 'Seating', key: 'seating', width: 10 },
        { header: 'Price', key: 'price', width: 20 },
        { header: 'Fraction Price', key: 'fractionPrice', width: 20 },
        { header: 'Token Price', key: 'tokenPrice', width: 20 },
        { header: 'Total Tickets', key: 'totalTickets', width: 15 },
        { header: 'Available Tickets', key: 'availableTickets', width: 15 },
        { header: 'Sold Tickets', key: 'soldTickets', width: 15 },
        { header: 'AMC/Ticket', key: 'amcPerTicket', width: 20 },
        { header: 'Contract Years', key: 'contractYears', width: 15 },
        { header: 'Location', key: 'location', width: 25 },
        { header: 'Pincode', key: 'pincode', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Features', key: 'features', width: 40 },
        { header: 'Expected Purchase Date', key: 'expectedPurchaseDate', width: 20 },
        { header: 'Tokens Available', key: 'tokensAvailable', width: 15 },
        { header: 'Book Now Token Available', key: 'bookNowTokenAvailable', width: 20 },
        { header: 'Book Now Token Price', key: 'bookNowTokenPrice', width: 20 }
      ],
      data: exportData
    };

    this.exportService.exportToExcel(options);
  }

  onPincodeChange(): void {
    this.pincodeError = '';

    // Clear any existing timeout
    if (this.pincodeTimeout) {
      clearTimeout(this.pincodeTimeout);
    }

    // Clear location if pincode is not valid
    if (this.newCar.pincode.length > 0 && this.newCar.pincode.length < 6) {
      this.newCar.location = '';
      this.pincodeError = 'Pincode must be 6 digits';
      return;
    }

    if (this.newCar.pincode.length > 0 && !/^\d{6}$/.test(this.newCar.pincode)) {
      this.newCar.location = '';
      this.pincodeError = 'Please enter a valid 6-digit pincode';
      return;
    }

    if (this.newCar.pincode.length === 0) {
      this.newCar.location = '';
      this.pincodeError = '';
      return;
    }

    // Only fetch location if pincode is exactly 6 digits - with debounce
    if (this.newCar.pincode.length === 6 && /^\d{6}$/.test(this.newCar.pincode)) {
      this.pincodeTimeout = setTimeout(() => {
        this.isPincodeLoading = true;

        this.pincodeService.getFormattedLocation(this.newCar.pincode).subscribe({
          next: (location) => {
            this.isPincodeLoading = false;
            if (location && location.trim() !== '') {
              this.newCar.location = location;
              this.pincodeError = '';
            } else {
              this.pincodeError = 'Invalid pincode. Please check and try again.';
              this.newCar.location = '';
            }
          },
          error: (error) => {
            this.isPincodeLoading = false;
            this.pincodeError = 'Unable to fetch location. Please enter manually.';
          }
        });
      }, 500); // 500ms debounce
    }
  }

}
