import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define interfaces for our data models
export interface Car {
  _id?: string;
  carname: string;
  color: string;
  milege: string;
  seating: number;
  features: string[];
  brandname: string;
  price: number;
  fractionprice: number;
  tokenprice: number;
  expectedpurchasedate: string;
  ticketsavilble: number;
  totaltickets: number;
  tokensavailble: number;
  bookNowTokenAvailable: number;
  bookNowTokenPrice: number;
  images: string[];
  createdBy: string;
  createdByModel: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarResponse {
  status: string;
  body: {
    car: Car;
    cars: Car[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private baseUrl = 'http://localhost:5000/api/cars';

  constructor(private http: HttpClient) { }

  // Create a new car
  createCar(carData: FormData): Observable<CarResponse> {
    return this.http.post<CarResponse>(`${this.baseUrl}/`, carData);
  }

  // Get all cars
  getCars(): Observable<CarResponse> {
    return this.http.get<CarResponse>(`${this.baseUrl}/`);
  }

  // Get a car by ID
  getCarById(id: string): Observable<CarResponse> {
    return this.http.get<CarResponse>(`${this.baseUrl}/${id}`);
  }

  // Update a car by ID
  updateCar(id: string, carData: FormData): Observable<CarResponse> {
    return this.http.put<CarResponse>(`${this.baseUrl}/${id}`, carData);
  }

  // Delete a car by ID
  deleteCar(id: string): Observable<CarResponse> {
    return this.http.delete<CarResponse>(`${this.baseUrl}/${id}`);
  }
}