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

export interface FAQCategory {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse {
  status: string;
  body: {
    faqs: FAQ[];
  };
  message: string;
}

export interface CategoryApiResponse {
  status: string;
  body: {
    categories: FAQCategory[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FaqPublicService {
  private apiUrl = `${environment.apiUrl}/home/faqs/public`;
  private categoryApiUrl = `${environment.apiUrl}/faq-categories/public`;

  constructor(private http: HttpClient) { }

  getPublicFaqs(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl);
  }

  getActiveFaqCategories(): Observable<CategoryApiResponse> {
    return this.http.get<CategoryApiResponse>(this.categoryApiUrl);
  }
}