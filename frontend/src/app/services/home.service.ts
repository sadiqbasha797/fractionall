import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

// Define interfaces for our data models
export interface HeroContent {
  _id?: string;
  bgImage?: string;
  heroText?: string;
  subText?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
}

export interface Brand {
  _id?: string;
  brandName?: string;
  brandLogo?: string;
  subText?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
}

export interface SimpleStep {
  _id?: string;
  stepTitle?: string;
  stepName?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
}

export interface FAQ {
  _id?: string;
  question?: string;
  category?: 'Understanding' | 'Pricing' | 'Car Delivery' | 'Car Usage Policy';
  answer?: string;
  createdAt?: string;
}

export interface HeroContentResponse {
  status: string;
  body: {
    heroContent?: HeroContent | HeroContent[];
  };
  message: string;
}

export interface BrandResponse {
  status: string;
  body: {
    brand?: Brand;
    brands?: Brand[];
  };
  message: string;
}

export interface SimpleStepResponse {
  status: string;
  body: {
    simpleStep?: SimpleStep;
    simpleSteps?: SimpleStep[];
  };
  message: string;
}

export interface FAQResponse {
  status: string;
  body: {
    faq?: FAQ;
    faqs?: FAQ[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.getApiUrl('/home');
  }

  // ==================== HERO CONTENT CRUD ====================

  // Create Hero Content
  createHeroContent(heroContentData: FormData): Observable<HeroContentResponse> {
    return this.http.post<HeroContentResponse>(`${this.baseUrl}/hero-content`, heroContentData);
  }

  // Get all Hero Content
  getHeroContent(): Observable<HeroContentResponse> {
    return this.http.get<HeroContentResponse>(`${this.baseUrl}/hero-content`);
  }

  // Get Hero Content by ID
  getHeroContentById(id: string): Observable<HeroContentResponse> {
    return this.http.get<HeroContentResponse>(`${this.baseUrl}/hero-content/${id}`);
  }

  // Update Hero Content
  updateHeroContent(id: string, heroContentData: FormData): Observable<HeroContentResponse> {
    return this.http.put<HeroContentResponse>(`${this.baseUrl}/hero-content/${id}`, heroContentData);
  }

  // Delete Hero Content
  deleteHeroContent(id: string): Observable<HeroContentResponse> {
    return this.http.delete<HeroContentResponse>(`${this.baseUrl}/hero-content/${id}`);
  }

  // ==================== BRANDS CRUD ====================

  // Create Brand
  createBrand(brandData: FormData): Observable<BrandResponse> {
    return this.http.post<BrandResponse>(`${this.baseUrl}/brands`, brandData);
  }

  // Get all Brands
  getBrands(): Observable<BrandResponse> {
    return this.http.get<BrandResponse>(`${this.baseUrl}/brands`);
  }

  // Get Brand by ID
  getBrandById(id: string): Observable<BrandResponse> {
    return this.http.get<BrandResponse>(`${this.baseUrl}/brands/${id}`);
  }

  // Update Brand
  updateBrand(id: string, brandData: FormData): Observable<BrandResponse> {
    return this.http.put<BrandResponse>(`${this.baseUrl}/brands/${id}`, brandData);
  }

  // Delete Brand
  deleteBrand(id: string): Observable<BrandResponse> {
    return this.http.delete<BrandResponse>(`${this.baseUrl}/brands/${id}`);
  }

  // ==================== SIMPLE STEPS CRUD ====================

  // Create Simple Step
  createSimpleStep(stepData: Partial<SimpleStep>): Observable<SimpleStepResponse> {
    return this.http.post<SimpleStepResponse>(`${this.baseUrl}/simple-steps`, stepData);
  }

  // Get all Simple Steps
  getSimpleSteps(): Observable<SimpleStepResponse> {
    return this.http.get<SimpleStepResponse>(`${this.baseUrl}/simple-steps`);
  }

  // Get Simple Step by ID
  getSimpleStepById(id: string): Observable<SimpleStepResponse> {
    return this.http.get<SimpleStepResponse>(`${this.baseUrl}/simple-steps/${id}`);
  }

  // Update Simple Step
  updateSimpleStep(id: string, stepData: Partial<SimpleStep>): Observable<SimpleStepResponse> {
    return this.http.put<SimpleStepResponse>(`${this.baseUrl}/simple-steps/${id}`, stepData);
  }

  // Delete Simple Step
  deleteSimpleStep(id: string): Observable<SimpleStepResponse> {
    return this.http.delete<SimpleStepResponse>(`${this.baseUrl}/simple-steps/${id}`);
  }

  // ==================== FAQ CRUD ====================

  // Create FAQ
  createFaq(faqData: Partial<FAQ>): Observable<FAQResponse> {
    return this.http.post<FAQResponse>(`${this.baseUrl}/faqs`, faqData);
  }

  // Get all FAQs
  getFaqs(): Observable<FAQResponse> {
    return this.http.get<FAQResponse>(`${this.baseUrl}/faqs`);
  }

  // Get FAQ by ID
  getFaqById(id: string): Observable<FAQResponse> {
    return this.http.get<FAQResponse>(`${this.baseUrl}/faqs/${id}`);
  }

  // Update FAQ
  updateFaq(id: string, faqData: Partial<FAQ>): Observable<FAQResponse> {
    return this.http.put<FAQResponse>(`${this.baseUrl}/faqs/${id}`, faqData);
  }

  // Delete FAQ
  deleteFaq(id: string): Observable<FAQResponse> {
    return this.http.delete<FAQResponse>(`${this.baseUrl}/faqs/${id}`);
  }

  // ==================== PUBLIC APIs ====================

  // Get public Hero Content
  getPublicHeroContent(): Observable<HeroContentResponse> {
    return this.http.get<HeroContentResponse>(`${this.baseUrl}/hero-content/public`);
  }

  // Get public Brands
  getPublicBrands(): Observable<BrandResponse> {
    return this.http.get<BrandResponse>(`${this.baseUrl}/brands/public`);
  }

  // Get public Simple Steps
  getPublicSimpleSteps(): Observable<SimpleStepResponse> {
    return this.http.get<SimpleStepResponse>(`${this.baseUrl}/simple-steps/public`);
  }

  // Get public FAQs
  getPublicFaqs(): Observable<FAQResponse> {
    return this.http.get<FAQResponse>(`${this.baseUrl}/faqs/public`);
  }
}