import { Component, OnInit } from '@angular/core';
import { CarService, Car } from '../../services/car.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cars.html',
  styleUrl: './cars.css'
})
export class Cars implements OnInit {
  cars: Car[] = [];
  totalCars: number = 0;
  selectedCar: Car | null = null;
  currentImageIndex: number = 0;
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
    images: [],
    createdBy: '', // This will be set by the backend based on the authenticated user
    createdByModel: '' // This will be set by the backend based on the authenticated user
  };
  isEditMode: boolean = false;
  currentCarId: string | null = null;
  selectedFiles: File[] = [];

  constructor(private carService: CarService) { }

  ngOnInit(): void {
    this.getCars();
  }

  getCars(): void {
    this.carService.getCars().subscribe((response) => {
      if (response.status === 'success') {
        this.cars = response.body.cars;
        this.totalCars = this.cars.length;
      } else {
        console.error('Failed to get cars:', response.message);
      }
    });
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

    if (this.isEditMode && this.currentCarId) {
      this.carService.updateCar(this.currentCarId, formData).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.getCars(); // Refresh the list
            this.closeModal();
            this.selectedFiles = []; // Clear selected files
            console.log('Car updated successfully');
          } else {
            console.error('Failed to update car:', response.message);
          }
        },
        error: (err) => {
          console.error('Error updating car:', err);
        }
      });
    } else {
      this.carService.createCar(formData).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.getCars(); // Refresh the list
            this.closeModal();
            this.selectedFiles = []; // Clear selected files
            console.log('Car created successfully');
          } else {
            console.error('Failed to create car:', response.message);
          }
        },
        error: (err) => {
          console.error('Error creating car:', err);
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

  deleteCar(id: string): void {
    if (confirm('Are you sure you want to delete this car?')) {
      this.carService.deleteCar(id).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.cars = this.cars.filter(car => car._id !== id);
            console.log('Car deleted successfully');
          } else {
            console.error('Failed to delete car:', response.message);
          }
        },
        error: (err) => {
          console.error('Error deleting car:', err);
        }
      });
    }
  }
}
