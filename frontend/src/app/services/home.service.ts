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
  video1?: string;
  video2?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
}

export interface SimpleStepsVideo {
  _id?: string;
  video1?: string;
  video2?: string;
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
  category?: string;
  answer?: string;
  createdAt?: string;
}

export interface FAQCategory {
  _id?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeaturedCar {
  _id?: string;
  carId: {
    _id: string;
    carname: string;
    brandname: string;
    color: string;
    price: number;
    fractionprice: number;
    tokenprice: number;
    images: string[];
    status: string;
    location?: string;
    pincode?: string;
    description?: string;
  };
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
}

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
  expectedpurchasedate?: string;
  ticketsavilble: number;
  totaltickets: number;
  tokensavailble: number;
  bookNowTokenAvailable: number;
  bookNowTokenPrice: number;
  amcperticket: number;
  contractYears: number;
  location: string;
  pincode: string;
  description: string;
  images: string[];
  createdBy: string;
  createdByModel: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface About {
  _id?: string;
  aboutheroimage?: string;
  aboutherotext?: string;
  aboutherosubtext?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
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

export interface SimpleStepsVideoResponse {
  status: string;
  body: {
    simpleStepsVideo?: SimpleStepsVideo;
    simpleStepsVideos?: SimpleStepsVideo[];
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

export interface FAQCategoryResponse {
  status: string;
  body: {
    category?: FAQCategory;
    categories?: FAQCategory[];
  };
  message: string;
}

export interface FeaturedCarResponse {
  status: string;
  body: {
    featuredCar?: FeaturedCar;
    featuredCars?: FeaturedCar[];
  };
  message: string;
}

export interface CarResponse {
  status: string;
  body: {
    car?: Car;
    cars?: Car[];
  };
  message: string;
}

export interface AboutResponse {
  status: string;
  body: {
    about?: About;
    abouts?: About[];
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

  // Create Simple Step (now only supports text fields)
  createSimpleStep(stepData: { stepTitle: string; stepName: string }): Observable<SimpleStepResponse> {
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

  // Update Simple Step (now only supports text fields)
  updateSimpleStep(id: string, stepData: { stepTitle: string; stepName: string }): Observable<SimpleStepResponse> {
    return this.http.put<SimpleStepResponse>(`${this.baseUrl}/simple-steps/${id}`, stepData);
  }

  // Delete Simple Step
  deleteSimpleStep(id: string): Observable<SimpleStepResponse> {
    return this.http.delete<SimpleStepResponse>(`${this.baseUrl}/simple-steps/${id}`);
  }

  // ==================== SIMPLE STEPS VIDEO CRUD ====================

  // Create Simple Steps Video (supports two videos via URL or file)
  createSimpleStepsVideo(videoData: FormData): Observable<SimpleStepsVideoResponse> {
    return this.http.post<SimpleStepsVideoResponse>(`${this.baseUrl}/simple-steps-videos`, videoData);
  }

  // Get all Simple Steps Videos
  getSimpleStepsVideos(): Observable<SimpleStepsVideoResponse> {
    return this.http.get<SimpleStepsVideoResponse>(`${this.baseUrl}/simple-steps-videos`);
  }

  // Get Simple Steps Video by ID
  getSimpleStepsVideoById(id: string): Observable<SimpleStepsVideoResponse> {
    return this.http.get<SimpleStepsVideoResponse>(`${this.baseUrl}/simple-steps-videos/${id}`);
  }

  // Update Simple Steps Video (supports two videos via URL or file)
  updateSimpleStepsVideo(id: string, videoData: FormData): Observable<SimpleStepsVideoResponse> {
    return this.http.put<SimpleStepsVideoResponse>(`${this.baseUrl}/simple-steps-videos/${id}`, videoData);
  }

  // Delete Simple Steps Video
  deleteSimpleStepsVideo(id: string): Observable<SimpleStepsVideoResponse> {
    return this.http.delete<SimpleStepsVideoResponse>(`${this.baseUrl}/simple-steps-videos/${id}`);
  }

  // Get public Simple Steps Videos
  getPublicSimpleStepsVideos(): Observable<SimpleStepsVideoResponse> {
    return this.http.get<SimpleStepsVideoResponse>(`${this.baseUrl}/simple-steps-videos/public`);
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

  // ==================== FAQ CATEGORY CRUD ====================

  // Create FAQ Category
  createFaqCategory(categoryData: Partial<FAQCategory>): Observable<FAQCategoryResponse> {
    return this.http.post<FAQCategoryResponse>(`${this.configService.getApiUrl('/faq-categories')}`, categoryData);
  }

  // Get all FAQ Categories (including inactive)
  getFaqCategories(): Observable<FAQCategoryResponse> {
    return this.http.get<FAQCategoryResponse>(`${this.configService.getApiUrl('/faq-categories')}`);
  }

  // Get active FAQ Categories only
  getActiveFaqCategories(): Observable<FAQCategoryResponse> {
    return this.http.get<FAQCategoryResponse>(`${this.configService.getApiUrl('/faq-categories')}/public`);
  }

  // Get FAQ Category by ID
  getFaqCategoryById(id: string): Observable<FAQCategoryResponse> {
    return this.http.get<FAQCategoryResponse>(`${this.configService.getApiUrl('/faq-categories')}/${id}`);
  }

  // Update FAQ Category
  updateFaqCategory(id: string, categoryData: Partial<FAQCategory>): Observable<FAQCategoryResponse> {
    return this.http.put<FAQCategoryResponse>(`${this.configService.getApiUrl('/faq-categories')}/${id}`, categoryData);
  }

  // Delete FAQ Category (soft delete)
  deleteFaqCategory(id: string): Observable<FAQCategoryResponse> {
    return this.http.delete<FAQCategoryResponse>(`${this.configService.getApiUrl('/faq-categories')}/${id}`);
  }

  // Hard delete FAQ Category (permanent deletion)
  hardDeleteFaqCategory(id: string): Observable<FAQCategoryResponse> {
    return this.http.delete<FAQCategoryResponse>(`${this.configService.getApiUrl('/faq-categories')}/${id}/hard`);
  }

  // ==================== ABOUT CRUD ====================

  // Create About content
  createAbout(aboutData: FormData): Observable<AboutResponse> {
    return this.http.post<AboutResponse>(`${this.configService.getApiUrl('/about')}`, aboutData);
  }

  // Get all About content
  getAbout(): Observable<AboutResponse> {
    return this.http.get<AboutResponse>(`${this.configService.getApiUrl('/about')}`);
  }

  // Get About content by ID
  getAboutById(id: string): Observable<AboutResponse> {
    return this.http.get<AboutResponse>(`${this.configService.getApiUrl('/about')}/${id}`);
  }

  // Update About content
  updateAbout(id: string, aboutData: FormData): Observable<AboutResponse> {
    return this.http.put<AboutResponse>(`${this.configService.getApiUrl('/about')}/${id}`, aboutData);
  }

  // Delete About content
  deleteAbout(id: string): Observable<AboutResponse> {
    return this.http.delete<AboutResponse>(`${this.configService.getApiUrl('/about')}/${id}`);
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

  // Get public About content
  getPublicAbout(): Observable<AboutResponse> {
    return this.http.get<AboutResponse>(`${this.configService.getApiUrl('/about')}/public`);
  }

  // ==================== FEATURED CARS CRUD ====================

  // Add car to featured cars
  addFeaturedCar(carId: string): Observable<FeaturedCarResponse> {
    return this.http.post<FeaturedCarResponse>(`${this.baseUrl}/featured-cars`, { carId });
  }

  // Get all featured cars
  getFeaturedCars(): Observable<FeaturedCarResponse> {
    return this.http.get<FeaturedCarResponse>(`${this.baseUrl}/featured-cars`);
  }

  // Remove car from featured cars
  removeFeaturedCar(carId: string): Observable<FeaturedCarResponse> {
    return this.http.delete<FeaturedCarResponse>(`${this.baseUrl}/featured-cars/${carId}`);
  }

  // Get public featured cars
  getPublicFeaturedCars(): Observable<FeaturedCarResponse> {
    return this.http.get<FeaturedCarResponse>(`${this.baseUrl}/featured-cars/public`);
  }

  // ==================== CARS API ====================

  // Get all cars (for selection in featured cars)
  getCars(): Observable<CarResponse> {
    return this.http.get<CarResponse>(`${this.configService.getApiUrl('/cars')}`);
  }
}
