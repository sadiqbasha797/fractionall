import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService, HeroContent, Brand, SimpleStep, FAQ } from '../services/home.service';
import { DialogService } from '../shared/dialog/dialog.service';
import { DialogComponent } from '../shared/dialog/dialog.component';


@Component({
  selector: 'app-manage-content',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent],
  templateUrl: './manage-content.html',
  styleUrl: './manage-content.css'
})
export class ManageContent implements OnInit {
  // Active tab management
  activeTab: 'hero' | 'brands' | 'steps' | 'faqs' = 'hero';
  
  // Loading states
  loading = false;
  submitting = false;
  
  // Data arrays
  heroContents: HeroContent[] = [];
  brands: Brand[] = [];
  simpleSteps: SimpleStep[] = [];
  faqs: FAQ[] = [];
  
  // Form models
  heroForm: Partial<HeroContent> = {};
  brandForm: Partial<Brand> = {};
  stepForm: Partial<SimpleStep> = {};
  faqForm: Partial<FAQ> = {};
  
  // Edit modes
  editingHero: HeroContent | null = null;
  editingBrand: Brand | null = null;
  editingStep: SimpleStep | null = null;
  editingFaq: FAQ | null = null;
  
  // File inputs
  selectedHeroImage: File | null = null;
  selectedBrandLogo: File | null = null;
  
  // Show add forms
  showAddHeroForm = false;
  showAddBrandForm = false;
  showAddStepForm = false;
  showAddFaqForm = false;
  
  // FAQ categories
  faqCategories = ['Understanding', 'Pricing', 'Car Delivery', 'Car Usage Policy'];
  
  constructor(
    private homeService: HomeService,
    public dialogService: DialogService
  ) {}
  
  ngOnInit(): void {
    this.loadAllData();
  }
  
  // ==================== GENERAL METHODS ====================
  
  setActiveTab(tab: 'hero' | 'brands' | 'steps' | 'faqs'): void {
    this.activeTab = tab;
    this.resetForms();
  }
  
  resetForms(): void {
    this.heroForm = {};
    this.brandForm = {};
    this.stepForm = {};
    this.faqForm = {};
    this.selectedHeroImage = null;
    this.selectedBrandLogo = null;
    this.editingHero = null;
    this.editingBrand = null;
    this.editingStep = null;
    this.editingFaq = null;
    this.showAddHeroForm = false;
    this.showAddBrandForm = false;
    this.showAddStepForm = false;
    this.showAddFaqForm = false;
  }
  
  loadAllData(): void {
    this.loading = true;
    
    // Load all data concurrently
    Promise.all([
      this.loadHeroContents(),
      this.loadBrands(),
      this.loadSimpleSteps(),
      this.loadFaqs()
    ]).finally(() => {
      this.loading = false;
    });
  }
  
  // ==================== HERO CONTENT METHODS ====================
  
  loadHeroContents(): Promise<void> {
    return new Promise((resolve) => {
      this.homeService.getHeroContent().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.body.heroContent) {
            this.heroContents = Array.isArray(response.body.heroContent) 
              ? response.body.heroContent 
              : [response.body.heroContent];
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading hero contents:', error);
          this.dialogService.showError('Error', 'Failed to load hero contents');
          resolve();
        }
      });
    });
  }
  
  onHeroImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        this.selectedHeroImage = file;
      } else {
        this.dialogService.showError('Invalid File', 'Please select a valid image file');
        event.target.value = '';
      }
    }
  }
  
  saveHeroContent(): void {
    if (!this.heroForm.heroText || !this.heroForm.subText) {
      this.dialogService.showError('Validation Error', 'Please fill in all required fields');
      return;
    }
    
    const formData = new FormData();
    formData.append('heroText', this.heroForm.heroText);
    formData.append('subText', this.heroForm.subText);
    
    if (this.heroForm.bgImage && !this.selectedHeroImage) {
      formData.append('bgImage', this.heroForm.bgImage);
    }
    
    if (this.selectedHeroImage) {
      formData.append('bgImage', this.selectedHeroImage);
    }
    
    this.submitting = true;
    
    const request = this.editingHero
      ? this.homeService.updateHeroContent(this.editingHero._id!, formData)
      : this.homeService.createHeroContent(formData);
    
    request.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.dialogService.showSuccess('Success', response.message);
          this.loadHeroContents();
          this.cancelEditHero();
        }
      },
      error: (error) => {
        this.dialogService.showError('Error', error.error?.message || 'Operation failed');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }
  
  editHero(hero: HeroContent): void {
    this.editingHero = hero;
    this.heroForm = { ...hero };
    this.selectedHeroImage = null;
    this.showAddHeroForm = true;
  }
  
  cancelEditHero(): void {
    this.editingHero = null;
    this.heroForm = {};
    this.selectedHeroImage = null;
    this.showAddHeroForm = false;
  }
  
  async deleteHero(hero: HeroContent): Promise<void> {
    const confirmed = await this.dialogService.confirmDelete(`hero content "${hero.heroText}"`);
    if (confirmed) {
      this.homeService.deleteHeroContent(hero._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.dialogService.showSuccess('Success', response.message);
            this.loadHeroContents();
          }
        },
        error: (error) => {
          this.dialogService.showError('Error', error.error?.message || 'Delete failed');
        }
      });
    }
  }
  
  // ==================== BRANDS METHODS ====================
  
  loadBrands(): Promise<void> {
    return new Promise((resolve) => {
      this.homeService.getBrands().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.body.brands) {
            this.brands = response.body.brands;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading brands:', error);
          this.dialogService.showError('Error', 'Failed to load brands');
          resolve();
        }
      });
    });
  }
  
  onBrandLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        this.selectedBrandLogo = file;
      } else {
        this.dialogService.showError('Invalid File', 'Please select a valid image file');
        event.target.value = '';
      }
    }
  }
  
  saveBrand(): void {
    if (!this.brandForm.brandName || !this.brandForm.subText) {
      this.dialogService.showError('Validation Error', 'Please fill in all required fields');
      return;
    }
    
    const formData = new FormData();
    formData.append('brandName', this.brandForm.brandName);
    formData.append('subText', this.brandForm.subText);
    
    if (this.brandForm.brandLogo && !this.selectedBrandLogo) {
      formData.append('brandLogo', this.brandForm.brandLogo);
    }
    
    if (this.selectedBrandLogo) {
      formData.append('brandLogo', this.selectedBrandLogo);
    }
    
    this.submitting = true;
    
    const request = this.editingBrand
      ? this.homeService.updateBrand(this.editingBrand._id!, formData)
      : this.homeService.createBrand(formData);
    
    request.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.dialogService.showSuccess('Success', response.message);
          this.loadBrands();
          this.cancelEditBrand();
        }
      },
      error: (error) => {
        this.dialogService.showError('Error', error.error?.message || 'Operation failed');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }
  
  editBrand(brand: Brand): void {
    this.editingBrand = brand;
    this.brandForm = { ...brand };
    this.selectedBrandLogo = null;
    this.showAddBrandForm = true;
  }
  
  cancelEditBrand(): void {
    this.editingBrand = null;
    this.brandForm = {};
    this.selectedBrandLogo = null;
    this.showAddBrandForm = false;
  }
  
  async deleteBrand(brand: Brand): Promise<void> {
    const confirmed = await this.dialogService.confirmDelete(`brand "${brand.brandName}"`);
    if (confirmed) {
      this.homeService.deleteBrand(brand._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.dialogService.showSuccess('Success', response.message);
            this.loadBrands();
          }
        },
        error: (error) => {
          this.dialogService.showError('Error', error.error?.message || 'Delete failed');
        }
      });
    }
  }
  
  // ==================== SIMPLE STEPS METHODS ====================
  
  loadSimpleSteps(): Promise<void> {
    return new Promise((resolve) => {
      this.homeService.getSimpleSteps().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.body.simpleSteps) {
            this.simpleSteps = response.body.simpleSteps;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading simple steps:', error);
          this.dialogService.showError('Error', 'Failed to load simple steps');
          resolve();
        }
      });
    });
  }
  
  saveSimpleStep(): void {
    if (!this.stepForm.stepTitle || !this.stepForm.stepName) {
      this.dialogService.showError('Validation Error', 'Please fill in all required fields');
      return;
    }
    
    this.submitting = true;
    
    const request = this.editingStep
      ? this.homeService.updateSimpleStep(this.editingStep._id!, this.stepForm)
      : this.homeService.createSimpleStep(this.stepForm);
    
    request.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.dialogService.showSuccess('Success', response.message);
          this.loadSimpleSteps();
          this.cancelEditStep();
        }
      },
      error: (error) => {
        this.dialogService.showError('Error', error.error?.message || 'Operation failed');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }
  
  editStep(step: SimpleStep): void {
    this.editingStep = step;
    this.stepForm = { ...step };
    this.showAddStepForm = true;
  }
  
  cancelEditStep(): void {
    this.editingStep = null;
    this.stepForm = {};
    this.showAddStepForm = false;
  }
  
  async deleteStep(step: SimpleStep): Promise<void> {
    const confirmed = await this.dialogService.confirmDelete(`step "${step.stepTitle}"`);
    if (confirmed) {
      this.homeService.deleteSimpleStep(step._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.dialogService.showSuccess('Success', response.message);
            this.loadSimpleSteps();
          }
        },
        error: (error) => {
          this.dialogService.showError('Error', error.error?.message || 'Delete failed');
        }
      });
    }
  }
  
  // ==================== FAQ METHODS ====================
  
  loadFaqs(): Promise<void> {
    return new Promise((resolve) => {
      this.homeService.getFaqs().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.body.faqs) {
            this.faqs = response.body.faqs;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading FAQs:', error);
          this.dialogService.showError('Error', 'Failed to load FAQs');
          resolve();
        }
      });
    });
  }
  
  saveFaq(): void {
    if (!this.faqForm.question || !this.faqForm.category || !this.faqForm.answer) {
      this.dialogService.showError('Validation Error', 'Please fill in all required fields');
      return;
    }
    
    this.submitting = true;
    
    const request = this.editingFaq
      ? this.homeService.updateFaq(this.editingFaq._id!, this.faqForm)
      : this.homeService.createFaq(this.faqForm);
    
    request.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.dialogService.showSuccess('Success', response.message);
          this.loadFaqs();
          this.cancelEditFaq();
        }
      },
      error: (error) => {
        this.dialogService.showError('Error', error.error?.message || 'Operation failed');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }
  
  editFaq(faq: FAQ): void {
    this.editingFaq = faq;
    this.faqForm = { ...faq };
    this.showAddFaqForm = true;
  }
  
  cancelEditFaq(): void {
    this.editingFaq = null;
    this.faqForm = {};
    this.showAddFaqForm = false;
  }
  
  async deleteFaq(faq: FAQ): Promise<void> {
    const confirmed = await this.dialogService.confirmDelete(`FAQ "${faq.question}"`);
    if (confirmed) {
      this.homeService.deleteFaq(faq._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.dialogService.showSuccess('Success', response.message);
            this.loadFaqs();
          }
        },
        error: (error) => {
          this.dialogService.showError('Error', error.error?.message || 'Delete failed');
        }
      });
    }
  }
}
