import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HeroContent {
  _id: string;
  bgImage: string;
  heroText: string;
  subText: string;
  createdBy: any;
  createdAt: string;
}

export interface ApiResponse {
  status: string;
  body: {
    heroContent: HeroContent[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class HomePublicService {
  private apiUrl = 'http://localhost:5000/api/home'; // Base URL for home APIs

  constructor(private http: HttpClient) { }

  getPublicHeroContent(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/hero-content/public`);
  }
}
