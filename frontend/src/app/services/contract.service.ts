import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define interfaces for our data models
export interface Contract {
  _id?: string;
  carid: string;
  contractDetails: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContractResponse {
  status: string;
  body: {
    contract: Contract;
    contracts: Contract[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private baseUrl = 'http://localhost:5000/api/contracts';

  constructor(private http: HttpClient) { }

  // Create a new contract
  createContract(contractData: Contract): Observable<ContractResponse> {
    return this.http.post<ContractResponse>(`${this.baseUrl}/`, contractData);
  }

  // Get all contracts
  getContracts(): Observable<ContractResponse> {
    return this.http.get<ContractResponse>(`${this.baseUrl}/`);
  }

  // Get a contract by ID
  getContractById(id: string): Observable<ContractResponse> {
    return this.http.get<ContractResponse>(`${this.baseUrl}/${id}`);
  }

  // Update a contract by ID
  updateContract(id: string, contractData: Contract): Observable<ContractResponse> {
    return this.http.put<ContractResponse>(`${this.baseUrl}/${id}`, contractData);
  }

  // Delete a contract by ID
  deleteContract(id: string): Observable<ContractResponse> {
    return this.http.delete<ContractResponse>(`${this.baseUrl}/${id}`);
  }
}