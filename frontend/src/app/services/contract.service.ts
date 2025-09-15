import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

// Define interfaces for our data models
export interface Contract {
  _id?: string;
  carid: {
    _id: string;
    carname: string;
    brandname: string;
    color: string;
    images: string[];
  } | string;
  userid: {
    _id: string;
    name: string;
    email: string;
  } | string;
  ticketid: {
    _id: string;
    ticketcustomid: string;
    ticketprice: number;
    pricepaid: number;
    pendingamount: number;
    ticketexpiry: string;
    ticketbroughtdate: string;
    ticketstatus: string;
  } | string;
  contract_docs: string[];
  createdby: string;
  createdByModel: 'Admin' | 'SuperAdmin';
  createdat?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContractResponse {
  status: string;
  body: {
    contract?: Contract;
    contracts?: Contract[];
    uploadedDocuments?: string[];
    documentUrl?: string;
  };
  message: string;
}

export interface CreateContractData {
  carid: string;
  userid: string;
  ticketid: string;
  contract_docs?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.getApiUrl('/contracts');
  }

  // Create a new contract
  createContract(contractData: CreateContractData): Observable<ContractResponse> {
    return this.http.post<ContractResponse>(`${this.baseUrl}/`, contractData);
  }

  // Create a new contract with file upload
  createContractWithFiles(contractData: CreateContractData, files: File[]): Observable<ContractResponse> {
    const formData = new FormData();
    
    // Add contract data
    Object.keys(contractData).forEach(key => {
      const value = (contractData as any)[key];
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    
    // Add files
    files.forEach(file => {
      formData.append('contract_docs', file);
    });
    
    return this.http.post<ContractResponse>(`${this.baseUrl}/`, formData);
  }

  // Get all contracts
  getContracts(): Observable<ContractResponse> {
    return this.http.get<ContractResponse>(`${this.baseUrl}/admin`);
  }

  // Get a contract by ID
  getContractById(id: string): Observable<ContractResponse> {
    return this.http.get<ContractResponse>(`${this.baseUrl}/admin/${id}`);
  }

  // Update a contract by ID
  updateContract(id: string, contractData: Partial<CreateContractData>): Observable<ContractResponse> {
    return this.http.put<ContractResponse>(`${this.baseUrl}/${id}`, contractData);
  }

  // Upload contract documents
  uploadContractDocuments(id: string, files: File[]): Observable<ContractResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('contract_docs', file);
    });
    return this.http.post<ContractResponse>(`${this.baseUrl}/upload/${id}`, formData);
  }

  // Delete contract documents
  deleteContractDocuments(id: string, docIndexes: number[]): Observable<ContractResponse> {
    return this.http.delete<ContractResponse>(`${this.baseUrl}/docs/${id}`, {
      body: { docIndexes }
    });
  }

  // Update contract documents (replace existing)
  updateContractDocuments(id: string, docIndexes: number[], files: File[]): Observable<ContractResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('contract_docs', file);
    });
    formData.append('docIndexes', JSON.stringify(docIndexes));
    return this.http.put<ContractResponse>(`${this.baseUrl}/docs/${id}`, formData);
  }

  // Get user's contract documents (for users)
  getUserContractDocuments(): Observable<ContractResponse> {
    return this.http.get<ContractResponse>(`${this.baseUrl}/my-contracts`);
  }

  // Download contract document
  downloadContractDocument(contractId: string, docIndex: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${contractId}/${docIndex}`, {
      responseType: 'blob'
    });
  }

  // Get contract document URL (for testing)
  getContractDocumentUrl(contractId: string, docIndex: number): Observable<ContractResponse> {
    return this.http.get<ContractResponse>(`${this.baseUrl}/document-url/${contractId}/${docIndex}`);
  }

  // Delete a contract by ID
  deleteContract(id: string): Observable<ContractResponse> {
    return this.http.delete<ContractResponse>(`${this.baseUrl}/${id}`);
  }
}