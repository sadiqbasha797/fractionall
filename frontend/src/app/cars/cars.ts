import { Component, OnInit } from '@angular/core';
import { CarService, Car } from '../services/car.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '../shared/dialog/dialog.service';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { LoadingDialogComponent } from '../shared/loading-dialog/loading-dialog.component';
import { ExportService, ExportOptions } from '../services/export.service';

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent, LoadingDialogComponent],
  templateUrl: './cars.html',
  styleUrl: './cars.css'
})
export class Cars implements OnInit {
  cars: Car[] = [];
  filteredCars: Car[] = [];
  totalCars: number = 0;
  selectedCar: Car | null = null;
  currentImageIndex: number = 0;
  searchTerm: string = '';
  statusFilter: string = 'all';
  brandFilter: string = 'all';
  uniqueBrands: string[] = [];
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
    createdByModel: '' // This will be set by the backend based on the authenticated user
  };
  isEditMode: boolean = false;
  currentCarId: string | null = null;
  selectedFiles: File[] = [];
  
  // Dialog states
  showDialog: boolean = false;
  showLoadingDialog: boolean = false;
  dialogConfig: any = {};
  loadingMessage: string = '';

  constructor(
    private carService: CarService,
    public dialogService: DialogService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.getCars();
    this.checkFontAwesomeLoaded();
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
      } else {
        console.error('Failed to get cars:', response.message);
      }
    });
  }

  extractUniqueBrands(): void {
    this.uniqueBrands = [...new Set(this.cars.map(car => car.brandname).filter(brand => brand))];
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
      
      return matchesSearch && matchesStatus && matchesBrand;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.brandFilter = 'all';
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
      createdByModel: ''
    };
    const modal = document.querySelector('.modal') as HTMLElement;
    if (modal) {
      modal.style.display = "block";
    }
  }

  updateFeatures(event: any): void {
    this.newCar.features = event.split(',').map((s: string) => s.trim());
  }

  closeModal(): void {
    const modal = document.querySelector('.modal') as HTMLElement;
    if (modal) {
      modal.style.display = "none";
    }
  }

  getTicketsProgress(car: Car): number {
    if (!car.totaltickets || car.totaltickets === 0) {
      return 0;
    }
    const sold = car.totaltickets - (car.ticketsavilble || 0);
    return (sold / car.totaltickets) * 100;
  }

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
  }

  submitCarForm(): void {
    const formData = new FormData();
    for (const key in this.newCar) {
      if (Object.prototype.hasOwnProperty.call(this.newCar, key)) {
        const value = (this.newCar as any)[key];
        if (Array.isArray(value)) {
          // For features, ensure it's a comma-separated string if not empty
          if (key === 'features' && value.length > 0) {
            formData.append(key, value.join(','));
          } else {
            value.forEach(item => formData.append(key, item));
          }
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      }
    }

    // Append selected files
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
            this.dialogService.showSuccess('Success', 'Car updated successfully!');
          } else {
            this.dialogService.showError('Error', `Failed to update car: ${response.message}`);
          }
        },
        error: (err) => {
          this.showLoadingDialog = false;
          this.dialogService.showError('Error', `Error updating car: ${err.message || 'Unknown error'}`);
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
            this.dialogService.showSuccess('Success', 'Car created successfully!');
          } else {
            this.dialogService.showError('Error', `Failed to create car: ${response.message}`);
          }
        },
        error: (err) => {
          this.showLoadingDialog = false;
          this.dialogService.showError('Error', `Error creating car: ${err.message || 'Unknown error'}`);
        }
      });
    }
  }

  editCar(car: Car): void {
    this.isEditMode = true;
    this.currentCarId = car._id!;
    this.newCar = { ...car }; // Copy car data to newCar for editing
    const modal = document.querySelector('.modal') as HTMLElement;
    if (modal) {
      modal.style.display = "block";
    }
  }

  async deleteCar(car: Car): Promise<void> {
    try {
      const confirmed = await this.dialogService.confirmDelete(car.carname);
      if (confirmed) {
        this.showLoadingDialog = true;
        this.loadingMessage = 'Deleting car...';
        
        this.carService.deleteCar(car._id!).subscribe({
          next: (response) => {
            this.showLoadingDialog = false;
            if (response.status === 'success') {
              this.cars = this.cars.filter(c => c._id !== car._id);
              this.applyFilters(); // Refresh filtered list
              this.dialogService.showSuccess('Success', 'Car deleted successfully!');
            } else {
              this.dialogService.showError('Error', `Failed to delete car: ${response.message}`);
            }
          },
          error: (err) => {
            this.showLoadingDialog = false;
            this.dialogService.showError('Error', `Error deleting car: ${err.message || 'Unknown error'}`);
          }
        });
      }
    } catch (error) {
      console.error('Error in delete confirmation:', error);
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
}
