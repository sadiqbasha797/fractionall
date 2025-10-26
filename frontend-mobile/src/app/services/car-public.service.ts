import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CarPublicService {
  private apiUrl = `${environment.apiUrl}/cars/public`;

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

  trackCarView(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/view`, {});
  }

  trackCarViewWithRetargeting(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers: { [key: string]: string } = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.http.post<any>(`${environment.apiUrl}/cars/${id}/view`, {}, { headers });
  }

  getMostBrowsedCars(limit?: number): Observable<any> {
    let url = `${this.apiUrl}/most-browsed`;
    if (limit) {
      url += `?limit=${limit}`;
    }
    return this.http.get<any>(url);
  }
}