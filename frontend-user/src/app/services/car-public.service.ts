import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarPublicService {
  private apiUrl = 'https://fractionbackend.projexino.com/api/cars/public';

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

  updateCar(id: string, updateData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, updateData);
  }

  updateBookNowTokenCount(id: string, bookNowTokenAvailable: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/book-now-token-count`, { bookNowTokenAvailable });
  }
}