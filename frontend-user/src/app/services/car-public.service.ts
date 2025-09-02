import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarPublicService {
  private apiUrl = 'http://localhost:5000/api/cars/public'; // Assuming backend runs on port 5000

  constructor(private http: HttpClient) { }

  getPublicCars(page?: number, limit?: number): Observable<any> {
    let url = this.apiUrl;
    if (page && limit) {
      url += `?page=${page}&limit=${limit}`;
    }
    return this.http.get<any>(url);
  }

  getPublicCarById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}