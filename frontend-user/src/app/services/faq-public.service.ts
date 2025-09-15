import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FAQ {
  _id: string;
  question: string;
  category: string;
  answer: string;
  createdAt: string;
}

export interface ApiResponse {
  status: string;
  body: {
    faqs: FAQ[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FaqPublicService {
  private apiUrl = `${environment.apiUrl}/home/faqs/public`;

  constructor(private http: HttpClient) { }

  getPublicFaqs(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl);
  }
}