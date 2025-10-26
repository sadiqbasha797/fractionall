import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HeroContent {
  _id: string;
  bgImage: string;
  heroText: string;
  subText: string;
  createdBy: any;
  createdAt: string;
}

export interface SimpleStep {
  _id: string;
  stepTitle: string;
  stepName: string;
  createdBy: any;
  createdAt: string;
}

export interface Brand {
  _id: string;
  brandName: string;
  brandLogo: string;
  subText: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface SimpleStepsVideo {
  _id: string;
  video1: string;
  video2: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface FeaturedCar {
  _id: string;
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
    seats?: number;
    milege?: string;
    features?: string[];
    ticketsavilble?: number;
    totaltickets?: number;
    tokensavailble?: number;
    bookNowTokenAvailable?: number;
    bookNowTokenPrice?: number;
    amcperticket?: number;
    contractYears?: number;
  };
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface About {
  _id: string;
  aboutheroimage: string;
  aboutherotext: string;
  aboutherosubtext: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface ApiResponse {
  status: string;
  body: {
    heroContent: HeroContent[];
  };
  message: string;
}

export interface SimpleStepsApiResponse {
  status: string;
  body: {
    simpleSteps: SimpleStep[];
  };
  message: string;
}

export interface FeaturedCarsApiResponse {
  status: string;
  body: {
    featuredCars: FeaturedCar[];
  };
  message: string;
}

export interface BrandsApiResponse {
  status: string;
  body: {
    brands: Brand[];
  };
  message: string;
}

export interface SimpleStepsVideoApiResponse {
  status: string;
  body: {
    simpleStepsVideos: SimpleStepsVideo[];
  };
  message: string;
}

export interface AboutApiResponse {
  status: string;
  body: {
    about: About[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class HomePublicService {
  private apiUrl = `${environment.apiUrl}/home`;

  constructor(private http: HttpClient) { }

  getPublicHeroContent(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/hero-content/public`);
  }

  getPublicSimpleSteps(): Observable<SimpleStepsApiResponse> {
    return this.http.get<SimpleStepsApiResponse>(`${this.apiUrl}/simple-steps/public`);
  }

  getPublicFeaturedCars(): Observable<FeaturedCarsApiResponse> {
    return this.http.get<FeaturedCarsApiResponse>(`${this.apiUrl}/featured-cars/public`);
  }

  getPublicBrands(): Observable<BrandsApiResponse> {
    return this.http.get<BrandsApiResponse>(`${this.apiUrl}/brands/public`);
  }

  getPublicSimpleStepsVideos(): Observable<SimpleStepsVideoApiResponse> {
    return this.http.get<SimpleStepsVideoApiResponse>(`${this.apiUrl}/simple-steps-videos/absolutely-public`);
  }

  getPublicAbout(): Observable<AboutApiResponse> {
    return this.http.get<AboutApiResponse>(`${environment.apiUrl}/about/public`);
  }
}
