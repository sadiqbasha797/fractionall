import { Component, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HomeService, HeroContent, Brand, SimpleStep, FAQ, FeaturedCar, Car, SimpleStepsVideo, FAQCategory, About } from '../services/home.service';


@Component({
  selector: 'app-manage-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-content.html',
  styleUrl: './manage-content.css'
})
export class ManageContent implements OnInit {
  // Form references
  @ViewChild('heroFormRef') heroFormRef!: NgForm;
  @ViewChild('brandFormRef') brandFormRef!: NgForm;
  @ViewChild('stepFormRef') stepFormRef!: NgForm;
  @ViewChild('stepVideoFormRef') stepVideoFormRef!: NgForm;
  @ViewChild('faqFormRef') faqFormRef!: NgForm;
  @ViewChild('aboutFormRef') aboutFormRef!: NgForm;

  // Active tab management
  activeTab: 'hero' | 'brands' | 'steps' | 'faqs' | 'featured-cars' | 'step-videos' | 'faq-categories' | 'about' = 'hero';

  // Loading states
  loading = false;
  submitting = false;
  
  // Loading state for refresh functionality
  isLoading: boolean = false;

  // Data arrays
  heroContents: HeroContent[] = [];
  brands: Brand[] = [];
  simpleSteps: SimpleStep[] = [];
  simpleStepsVideos: SimpleStepsVideo[] = [];
  // simpleStepsSection removed
  faqs: FAQ[] = [];
  faqCategories: FAQCategory[] = [];
  featuredCars: FeaturedCar[] = [];
  allCars: Car[] = [];
  filteredCars: Car[] = [];
  abouts: About[] = [];

  // Form models
  heroForm: Partial<HeroContent> = {};
  brandForm: Partial<Brand> = {};
  stepForm: Partial<SimpleStep> = {};
  stepVideoForm: Partial<SimpleStepsVideo> = {};
  // sectionForm removed
  faqForm: Partial<FAQ> = {};
  faqCategoryForm: Partial<FAQCategory> = {};
  aboutForm: Partial<About> = {};

  // Edit modes
  editingHero: HeroContent | null = null;
  editingBrand: Brand | null = null;
  editingStep: SimpleStep | null = null;
  editingStepVideo: SimpleStepsVideo | null = null;
  editingFaq: FAQ | null = null;
  editingFaqCategory: FAQCategory | null = null;
  editingAbout: About | null = null;
  
  // Track which specific item is being edited for inline forms
  editingHeroId: string | null = null;
  editingBrandId: string | null = null;
  editingStepId: string | null = null;
  editingStepVideoId: string | null = null;
  editingFaqId: string | null = null;
  editingFaqCategoryId: string | null = null;
  editingAboutId: string | null = null;

  // File inputs
  selectedHeroImage: File | null = null;
  selectedBrandLogo: File | null = null;
  selectedStepVideo1: File | null = null;
  selectedStepVideo2: File | null = null;
  selectedStepVideoFile1: File | null = null;
  selectedStepVideoFile2: File | null = null;
  selectedAboutImage: File | null = null;
  showStepVideos = false;

  // Video input type toggles for step videos
  stepVideo1InputType: 'url' | 'file' = 'url';
  stepVideo2InputType: 'url' | 'file' = 'url';

  // Show add forms
  showAddHeroForm = false;
  showAddBrandForm = false;
  showAddStepForm = false;
  showAddStepVideoForm = false;
  showStepVideosForm = false;
  // showSectionForm removed
  showAddFaqForm = false;
  showAddFaqCategoryForm = false;
  showAddAboutForm = false;

  // Featured cars filters
  carSearchTerm = '';
  carStatusFilter = 'all';
  carBrandFilter = 'all';
  uniqueCarBrands: string[] = [];
  
  // Dialog element
  private dialogElement: HTMLElement | null = null;

  constructor(
    private homeService: HomeService,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.loadAllData();
  }

  // Local dialog methods
  showConfirmDialog(title: string, message: string, confirmCallback: () => void): void {
    this.removeDialog();
    const backdrop = this.renderer.createElement('div');
    this.renderer.setStyle(backdrop, 'position', 'fixed');
    this.renderer.setStyle(backdrop, 'top', '0');
    this.renderer.setStyle(backdrop, 'left', '0');
    this.renderer.setStyle(backdrop, 'width', '100vw');
    this.renderer.setStyle(backdrop, 'height', '100vh');
    this.renderer.setStyle(backdrop, 'background', 'rgba(0, 0, 0, 0.8)');
    this.renderer.setStyle(backdrop, 'z-index', '999999');
    this.renderer.setStyle(backdrop, 'display', 'flex');
    this.renderer.setStyle(backdrop, 'align-items', 'center');
    this.renderer.setStyle(backdrop, 'justify-content', 'center');
    const dialog = this.renderer.createElement('div');
    this.renderer.setStyle(dialog, 'background', '#374151');
    this.renderer.setStyle(dialog, 'border-radius', '12px');
    this.renderer.setStyle(dialog, 'max-width', '500px');
    this.renderer.setStyle(dialog, 'width', '90%');
    this.renderer.setStyle(dialog, 'padding', '24px');
    const titleEl = this.renderer.createElement('h3');
    this.renderer.setStyle(titleEl, 'color', 'white');
    this.renderer.setStyle(titleEl, 'margin', '0 0 16px 0');
    this.renderer.setStyle(titleEl, 'font-size', '1.5rem');
    const titleText = this.renderer.createText(title);
    this.renderer.appendChild(titleEl, titleText);
    const messageEl = this.renderer.createElement('div');
    this.renderer.setProperty(messageEl, 'innerHTML', message);
    this.renderer.setStyle(messageEl, 'color', '#E5E7EB');
    this.renderer.setStyle(messageEl, 'margin-bottom', '24px');
    const btnContainer = this.renderer.createElement('div');
    this.renderer.setStyle(btnContainer, 'display', 'flex');
    this.renderer.setStyle(btnContainer, 'justify-content', 'flex-end');
    this.renderer.setStyle(btnContainer, 'gap', '12px');
    const cancelBtn = this.renderer.createElement('button');
    const cancelText = this.renderer.createText('Cancel');
    this.renderer.appendChild(cancelBtn, cancelText);
    this.renderer.setStyle(cancelBtn, 'background', '#6B7280');
    this.renderer.setStyle(cancelBtn, 'color', 'white');
    this.renderer.setStyle(cancelBtn, 'border', 'none');
    this.renderer.setStyle(cancelBtn, 'padding', '10px 20px');
    this.renderer.setStyle(cancelBtn, 'border-radius', '8px');
    this.renderer.setStyle(cancelBtn, 'cursor', 'pointer');
    this.renderer.listen(cancelBtn, 'click', () => this.removeDialog());
    const confirmBtn = this.renderer.createElement('button');
    const confirmText = this.renderer.createText('Confirm');
    this.renderer.appendChild(confirmBtn, confirmText);
    this.renderer.setStyle(confirmBtn, 'background', '#DC2626');
    this.renderer.setStyle(confirmBtn, 'color', 'white');
    this.renderer.setStyle(confirmBtn, 'border', 'none');
    this.renderer.setStyle(confirmBtn, 'padding', '10px 20px');
    this.renderer.setStyle(confirmBtn, 'border-radius', '8px');
    this.renderer.setStyle(confirmBtn, 'cursor', 'pointer');
    this.renderer.listen(confirmBtn, 'click', () => {
      this.removeDialog();
      confirmCallback();
    });
    this.renderer.appendChild(btnContainer, cancelBtn);
    this.renderer.appendChild(btnContainer, confirmBtn);
    this.renderer.appendChild(dialog, titleEl);
    this.renderer.appendChild(dialog, messageEl);
    this.renderer.appendChild(dialog, btnContainer);
    this.renderer.appendChild(backdrop, dialog);
    this.renderer.appendChild(document.body, backdrop);
    this.dialogElement = backdrop;
    this.renderer.listen(dialog, 'click', (e: Event) => e.stopPropagation());
    this.renderer.listen(backdrop, 'click', () => this.removeDialog());
  }
  removeDialog(): void {
    if (this.dialogElement) {
      this.renderer.removeChild(document.body, this.dialogElement);
      this.dialogElement = null;
    }
  }
  showSuccessDialog(message: string): void {
    this.showMessageDialog('Success', message, '#10B981');
  }
  showErrorDialog(message: string): void {
    this.showMessageDialog('Error', message, '#DC2626');
  }
  showMessageDialog(title: string, message: string, color: string): void {
    this.removeDialog();
    const backdrop = this.renderer.createElement('div');
    this.renderer.setStyle(backdrop, 'position', 'fixed');
    this.renderer.setStyle(backdrop, 'top', '0');
    this.renderer.setStyle(backdrop, 'left', '0');
    this.renderer.setStyle(backdrop, 'width', '100vw');
    this.renderer.setStyle(backdrop, 'height', '100vh');
    this.renderer.setStyle(backdrop, 'background', 'rgba(0, 0, 0, 0.8)');
    this.renderer.setStyle(backdrop, 'z-index', '999999');
    this.renderer.setStyle(backdrop, 'display', 'flex');
    this.renderer.setStyle(backdrop, 'align-items', 'center');
    this.renderer.setStyle(backdrop, 'justify-content', 'center');
    const dialog = this.renderer.createElement('div');
    this.renderer.setStyle(dialog, 'background', '#374151');
    this.renderer.setStyle(dialog, 'border-radius', '12px');
    this.renderer.setStyle(dialog, 'max-width', '400px');
    this.renderer.setStyle(dialog, 'width', '90%');
    this.renderer.setStyle(dialog, 'padding', '24px');
    this.renderer.setStyle(dialog, 'text-align', 'center');
    const titleEl = this.renderer.createElement('h3');
    this.renderer.setStyle(titleEl, 'color', color);
    this.renderer.setStyle(titleEl, 'margin', '0 0 16px 0');
    this.renderer.setStyle(titleEl, 'font-size', '1.5rem');
    this.renderer.setStyle(titleEl, 'font-weight', '600');
    const titleText = this.renderer.createText(title);
    this.renderer.appendChild(titleEl, titleText);
    const messageEl = this.renderer.createElement('div');
    this.renderer.setProperty(messageEl, 'innerHTML', message);
    this.renderer.setStyle(messageEl, 'color', '#E5E7EB');
    this.renderer.setStyle(messageEl, 'margin-bottom', '24px');
    const okBtn = this.renderer.createElement('button');
    const okText = this.renderer.createText('OK');
    this.renderer.appendChild(okBtn, okText);
    this.renderer.setStyle(okBtn, 'background', color);
    this.renderer.setStyle(okBtn, 'color', 'white');
    this.renderer.setStyle(okBtn, 'border', 'none');
    this.renderer.setStyle(okBtn, 'padding', '10px 30px');
    this.renderer.setStyle(okBtn, 'border-radius', '8px');
    this.renderer.setStyle(okBtn, 'cursor', 'pointer');
    this.renderer.setStyle(okBtn, 'font-size', '14px');
    this.renderer.setStyle(okBtn, 'font-weight', '600');
    this.renderer.listen(okBtn, 'click', () => this.removeDialog());
    this.renderer.appendChild(dialog, titleEl);
    this.renderer.appendChild(dialog, messageEl);
    this.renderer.appendChild(dialog, okBtn);
    this.renderer.appendChild(backdrop, dialog);
    this.renderer.appendChild(document.body, backdrop);
    this.dialogElement = backdrop;
    this.renderer.listen(backdrop, 'click', () => this.removeDialog());
    this.renderer.listen(dialog, 'click', (e: Event) => e.stopPropagation());
  }

  // ==================== REFRESH METHODS ====================

  refreshHeroContent(): void {
    this.isLoading = true;
    this.loadHeroContents().finally(() => {
      this.isLoading = false;
    });
  }

  refreshBrands(): void {
    this.isLoading = true;
    this.loadBrands().finally(() => {
      this.isLoading = false;
    });
  }

  refreshSimpleSteps(): void {
    this.isLoading = true;
    this.loadSimpleSteps().finally(() => {
      this.isLoading = false;
    });
  }

  refreshFaqs(): void {
    this.isLoading = true;
    this.loadFaqs().finally(() => {
      this.isLoading = false;
    });
  }

  // ==================== GENERAL METHODS ====================

  setActiveTab(tab: 'hero' | 'brands' | 'steps' | 'faqs' | 'featured-cars' | 'step-videos' | 'faq-categories' | 'about'): void {
    this.activeTab = tab;
    this.resetForms();
    if (tab === 'featured-cars') {
      this.loadFeaturedCarsData();
    }
    if (tab === 'step-videos') {
      this.loadSimpleStepsVideos();
    }
  }

  resetForms(): void {
    this.heroForm = {};
    this.brandForm = {};
    this.stepForm = {};
    this.stepVideoForm = {};
    this.faqForm = {};
    this.selectedHeroImage = null;
    this.selectedBrandLogo = null;
    this.selectedStepVideo1 = null;
    this.selectedStepVideo2 = null;
    this.selectedStepVideoFile1 = null;
    this.selectedStepVideoFile2 = null;
    this.editingHero = null;
    this.editingBrand = null;
    this.editingStep = null;
    this.editingStepVideo = null;
    this.editingFaq = null;
    this.showAddHeroForm = false;
    this.showAddBrandForm = false;
    this.showAddStepForm = false;
    this.showAddStepVideoForm = false;
    this.showStepVideosForm = false;
    this.showAddFaqForm = false;
  }

  loadAllData(): void {
    this.loading = true;

    // Load all data concurrently
    Promise.all([
      this.loadHeroContents(),
      this.loadBrands(),
      this.loadSimpleSteps(),
      this.loadSimpleStepsVideos(),
      // loadSimpleStepsSection removed,
      this.loadFaqs(),
      this.loadFaqCategories(),
      this.loadAbouts()
    ]).finally(() => {
      this.loading = false;
    });
  }

  // ==================== SIMPLE STEPS VIDEO METHODS ====================

  loadSimpleStepsVideos(): Promise<void> {
    return new Promise((resolve) => {
      this.homeService.getSimpleStepsVideos().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.body.simpleStepsVideos) {
            this.simpleStepsVideos = response.body.simpleStepsVideos;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading simple steps videos:', error);
          this.showErrorDialog('Failed to load simple steps videos');
          resolve();
        }
      });
    });
  }

  saveSimpleStepsVideo(): void {
    this.submitting = true;

    // Build FormData for mixed URL/file uploads
    const formData = new FormData();

    // Handle video1
    if (this.selectedStepVideoFile1) {
      formData.append('video1', this.selectedStepVideoFile1);
    } else if (this.stepVideoForm.video1) {
      formData.append('video1', this.stepVideoForm.video1);
    }

    // Handle video2
    if (this.selectedStepVideoFile2) {
      formData.append('video2', this.selectedStepVideoFile2);
    } else if (this.stepVideoForm.video2) {
      formData.append('video2', this.stepVideoForm.video2);
    }

    const request = this.editingStepVideo
      ? this.homeService.updateSimpleStepsVideo(this.editingStepVideo._id!, formData)
      : this.homeService.createSimpleStepsVideo(formData);

    request.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.showSuccessDialog(response.message);
          this.loadSimpleStepsVideos();
          this.cancelEditStepVideo();
        }
      },
      error: (error) => {
        this.showErrorDialog(error.error?.message || 'Operation failed');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  editStepVideo(video: SimpleStepsVideo): void {
    this.editingStepVideo = video;
    this.editingStepVideoId = video._id || null;
    this.stepVideoForm = { ...video };
    this.showAddStepVideoForm = true;
    this.selectedStepVideoFile1 = null;
    this.selectedStepVideoFile2 = null;
    this.stepVideo1InputType = 'url';
    this.stepVideo2InputType = 'url';
  }

  cancelEditStepVideo(): void {
    this.editingStepVideo = null;
    this.editingStepVideoId = null;
    this.stepVideoForm = {};
    this.selectedStepVideoFile1 = null;
    this.selectedStepVideoFile2 = null;
    this.stepVideo1InputType = 'url';
    this.stepVideo2InputType = 'url';
    this.showAddStepVideoForm = false;
  }

  deleteStepVideo(video: SimpleStepsVideo): void {
    this.showConfirmDialog('Confirm Delete', 'Are you sure you want to delete this step video entry?', () => {
      this.homeService.deleteSimpleStepsVideo(video._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.showSuccessDialog(response.message);
            this.loadSimpleStepsVideos();
          }
        },
        error: (error) => {
          this.showErrorDialog(error.error?.message || 'Delete failed');
        }
      });
    });
  }

  // Handlers for selecting step videos
  onStepVideoFile1Selected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      this.showErrorDialog('Please select a video file for Video 1');
      event.target.value = '';
      return;
    }
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showErrorDialog('Video 1 must be less than 50MB');
      event.target.value = '';
      return;
    }
    this.selectedStepVideoFile1 = file;
    if (this.stepVideoForm) {
      this.stepVideoForm.video1 = '';
    }
  }

  onStepVideoFile2Selected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      this.showErrorDialog('Please select a video file for Video 2');
      event.target.value = '';
      return;
    }
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showErrorDialog('Video 2 must be less than 50MB');
      event.target.value = '';
      return;
    }
    this.selectedStepVideoFile2 = file;
    if (this.stepVideoForm) {
      this.stepVideoForm.video2 = '';
    }
  }

  onStepVideo1InputTypeChange(): void {
    if (this.stepVideo1InputType === 'url') {
      this.selectedStepVideoFile1 = null;
    } else {
      if (this.stepVideoForm) {
        this.stepVideoForm.video1 = '';
      }
    }
  }

  onStepVideo2InputTypeChange(): void {
    if (this.stepVideo2InputType === 'url') {
      this.selectedStepVideoFile2 = null;
    } else {
      if (this.stepVideoForm) {
        this.stepVideoForm.video2 = '';
      }
    }
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
          this.showErrorDialog('Failed to load hero contents');
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
        this.showErrorDialog('Please select a valid image file');
        event.target.value = '';
      }
    }
  }

  saveHeroContent(): void {
    if (!this.heroForm.heroText || !this.heroForm.subText) {
      this.showErrorDialog('Please fill in all required fields');
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
          this.showSuccessDialog(response.message);
          this.loadHeroContents();
          this.cancelEditHero();
        }
      },
      error: (error) => {
        this.showErrorDialog(error.error?.message || 'Operation failed');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  editHero(hero: HeroContent): void {
    this.editingHero = hero;
    this.editingHeroId = hero._id || null;
    this.heroForm = { ...hero };
    this.selectedHeroImage = null;
    // Don't set showAddHeroForm = true when editing
  }

  cancelEditHero(): void {
    this.editingHero = null;
    this.editingHeroId = null;
    this.heroForm = {};
    this.selectedHeroImage = null;
    this.showAddHeroForm = false;
  }

  deleteHero(hero: HeroContent): void {
    this.showConfirmDialog('Confirm Delete', `Are you sure you want to delete hero content "${hero.heroText}"?`, () => {
      this.homeService.deleteHeroContent(hero._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.showSuccessDialog(response.message);
            this.loadHeroContents();
          }
        },
        error: (error) => {
          this.showErrorDialog(error.error?.message || 'Delete failed');
        }
      });
    });
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
          this.showErrorDialog('Failed to load brands');
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
        this.showErrorDialog('Please select a valid image file');
        event.target.value = '';
      }
    }
  }

  saveBrand(): void {
    if (!this.brandForm.brandName || !this.brandForm.subText) {
      this.showErrorDialog('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('brandName', this.brandForm.brandName.trim());
    formData.append('subText', this.brandForm.subText.trim());

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
          this.showSuccessDialog(response.message);
          this.loadBrands();
          this.cancelEditBrand();
        }
      },
      error: (error) => {
        this.showErrorDialog(error.error?.message || 'Operation failed');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  editBrand(brand: Brand): void {
    this.editingBrand = brand;
    this.editingBrandId = brand._id || null;
    this.brandForm = { ...brand };
    this.selectedBrandLogo = null;
    // Don't set showAddBrandForm = true when editing
  }

  cancelEditBrand(): void {
    this.editingBrand = null;
    this.editingBrandId = null;
    this.brandForm = {};
    this.selectedBrandLogo = null;
    this.showAddBrandForm = false;
  }

  deleteBrand(brand: Brand): void {
    this.showConfirmDialog('Confirm Delete', `Are you sure you want to delete brand "${brand.brandName}"?`, () => {
      this.homeService.deleteBrand(brand._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.showSuccessDialog(response.message);
            this.loadBrands();
          }
        },
        error: (error) => {
          this.showErrorDialog(error.error?.message || 'Delete failed');
        }
      });
    });
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
          this.showErrorDialog('Failed to load simple steps');
          resolve();
        }
      });
    });
  }

  saveSimpleStep(): void {
    if (!this.stepForm.stepTitle || !this.stepForm.stepName) {
      this.showErrorDialog('Please fill in all required fields');
      return;
    }

    this.submitting = true;

    // Build regular object since we're no longer handling videos in SimpleSteps
    const stepData = {
      stepTitle: this.stepForm.stepTitle,
      stepName: this.stepForm.stepName
    };

    const request = this.editingStep
      ? this.homeService.updateSimpleStep(this.editingStep._id!, stepData)
      : this.homeService.createSimpleStep(stepData);

    request.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.showSuccessDialog(response.message);
          this.loadSimpleSteps();
          this.cancelEditStep();
        }
      },
      error: (error) => {
        this.showErrorDialog(error.error?.message || 'Operation failed');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  editStep(step: SimpleStep): void {
    this.editingStep = step;
    this.editingStepId = step._id || null;
    this.stepForm = { ...step };
    // Don't set showAddStepForm = true when editing
    this.selectedStepVideo1 = null;
    this.selectedStepVideo2 = null;
    this.stepVideo1InputType = 'url';
    this.stepVideo2InputType = 'url';
    this.showStepVideos = false;
  }

  cancelEditStep(): void {
    this.editingStep = null;
    this.editingStepId = null;
    this.stepForm = {};
    this.selectedStepVideo1 = null;
    this.selectedStepVideo2 = null;
    this.stepVideo1InputType = 'url';
    this.stepVideo2InputType = 'url';
    this.showStepVideos = false;
    this.showAddStepForm = false;
  }

  deleteStep(step: SimpleStep): void {
    this.showConfirmDialog('Confirm Delete', `Are you sure you want to delete step "${step.stepTitle}"?`, () => {
      this.homeService.deleteSimpleStep(step._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.showSuccessDialog(response.message);
            this.loadSimpleSteps();
          }
        },
        error: (error) => {
          this.showErrorDialog(error.error?.message || 'Delete failed');
        }
      });
    });
  }

  // SimpleStepsSection UI removed

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
          this.showErrorDialog('Failed to load FAQs');
          resolve();
        }
      });
    });
  }

  saveFaq(): void {
    if (!this.faqForm.question || !this.faqForm.category || !this.faqForm.answer) {
      this.showErrorDialog('Please fill in all required fields');
      return;
    }

    this.submitting = true;

    const request = this.editingFaq
      ? this.homeService.updateFaq(this.editingFaq._id!, this.faqForm)
      : this.homeService.createFaq(this.faqForm);

    request.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.showSuccessDialog(response.message);
          this.loadFaqs();
          this.cancelEditFaq();
        }
      },
      error: (error) => {
        this.showErrorDialog(error.error?.message || 'Operation failed');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  editFaq(faq: FAQ): void {
    this.editingFaq = faq;
    this.editingFaqId = faq._id || null;
    this.faqForm = { ...faq };
    // Don't set showAddFaqForm = true when editing
  }

  cancelEditFaq(): void {
    this.editingFaq = null;
    this.editingFaqId = null;
    this.faqForm = {};
    this.showAddFaqForm = false;
  }

  deleteFaq(faq: FAQ): void {
    this.showConfirmDialog('Confirm Delete', `Are you sure you want to delete FAQ "${faq.question}"?`, () => {
      this.homeService.deleteFaq(faq._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.showSuccessDialog(response.message);
            this.loadFaqs();
          }
        },
        error: (error) => {
          this.showErrorDialog(error.error?.message || 'Delete failed');
        }
      });
    });
  }

  // ==================== FAQ CATEGORY METHODS ====================

  loadFaqCategories(): Promise<void> {
    return new Promise((resolve) => {
      this.homeService.getFaqCategories().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.body.categories) {
            this.faqCategories = response.body.categories;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading FAQ categories:', error);
          this.showErrorDialog('Failed to load FAQ categories');
          resolve();
        }
      });
    });
  }

  saveFaqCategory(): void {
    if (!this.faqCategoryForm.name) {
      this.showErrorDialog('Please fill in the category name');
      return;
    }

    this.submitting = true;

    const request = this.editingFaqCategory
      ? this.homeService.updateFaqCategory(this.editingFaqCategory._id!, this.faqCategoryForm)
      : this.homeService.createFaqCategory(this.faqCategoryForm);

    request.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.showSuccessDialog(response.message);
          this.loadFaqCategories();
          this.cancelEditFaqCategory();
        }
      },
      error: (error) => {
        this.showErrorDialog(error.error?.message || 'Operation failed');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  editFaqCategory(category: FAQCategory): void {
    this.editingFaqCategory = category;
    this.editingFaqCategoryId = category._id || null;
    this.faqCategoryForm = { ...category };
  }

  cancelEditFaqCategory(): void {
    this.editingFaqCategory = null;
    this.editingFaqCategoryId = null;
    this.faqCategoryForm = {};
    this.showAddFaqCategoryForm = false;
  }

  deleteFaqCategory(category: FAQCategory): void {
    this.showConfirmDialog('Confirm Delete', `Are you sure you want to permanently delete category "${category.name}"? This action cannot be undone.`, () => {
      this.homeService.hardDeleteFaqCategory(category._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.showSuccessDialog(response.message);
            this.loadFaqCategories();
          }
        },
        error: (error) => {
          this.showErrorDialog(error.error?.message || 'Delete failed');
        }
      });
    });
  }

  toggleFaqCategoryStatus(category: FAQCategory): void {
    const newStatus = !category.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    this.showConfirmDialog('Confirm Status Change', `Are you sure you want to ${action} category "${category.name}"?`, () => {
      this.homeService.updateFaqCategory(category._id!, { isActive: newStatus }).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.showSuccessDialog(response.message);
            this.loadFaqCategories();
          }
        },
        error: (error) => {
          this.showErrorDialog(error.error?.message || 'Status update failed');
        }
      });
    });
  }

  // ==================== FEATURED CARS METHODS ====================

  async loadFeaturedCarsData(): Promise<void> {
    this.loading = true;
    try {
      // Load featured cars and all cars in parallel using firstValueFrom instead of deprecated toPromise()
      const [featuredCarsResponse, carsResponse] = await Promise.all([
        firstValueFrom(this.homeService.getFeaturedCars()),
        firstValueFrom(this.homeService.getCars())
      ]);

      console.log('Featured cars response:', featuredCarsResponse); // Debug log
      
      if (featuredCarsResponse?.status === 'success') {
        this.featuredCars = featuredCarsResponse.body?.featuredCars || [];
        console.log('Loaded featured cars:', this.featuredCars); // Debug log
      } else {
        console.error('Failed to load featured cars:', featuredCarsResponse);
        this.featuredCars = [];
      }

      if (carsResponse?.status === 'success') {
        this.allCars = carsResponse.body?.cars || [];
        this.filteredCars = [...this.allCars];
        this.uniqueCarBrands = [...new Set(this.allCars.map(car => car.brandname?.trim()).filter(brand => brand))].sort();
        this.applyCarFilters();
        console.log('Loaded all cars:', this.allCars.length); // Debug log
      } else {
        console.error('Failed to load cars:', carsResponse);
        this.allCars = [];
        this.filteredCars = [];
      }
    } catch (error) {
      console.error('Error loading featured cars data:', error);
      this.showErrorDialog('Failed to load featured cars data');
      this.featuredCars = [];
      this.allCars = [];
      this.filteredCars = [];
    } finally {
      this.loading = false;
    }
  }

  applyCarFilters(): void {
    this.filteredCars = this.allCars.filter(car => {
      const matchesSearch = !this.carSearchTerm ||
        car.carname.toLowerCase().includes(this.carSearchTerm.toLowerCase()) ||
        car.brandname.toLowerCase().includes(this.carSearchTerm.toLowerCase());

      const matchesStatus = this.carStatusFilter === 'all' || car.status === this.carStatusFilter;
      const matchesBrand = this.carBrandFilter === 'all' || car.brandname === this.carBrandFilter;

      return matchesSearch && matchesStatus && matchesBrand;
    });
  }

  onCarSearchChange(): void {
    this.applyCarFilters();
  }

  onCarStatusFilterChange(): void {
    this.applyCarFilters();
  }

  onCarBrandFilterChange(): void {
    this.applyCarFilters();
  }

  isCarFeatured(carId: string): boolean {
    return this.featuredCars.some(fc => fc.carId?._id === carId);
  }

  addToFeaturedCars(car: Car): void {
    this.showConfirmDialog('Add to Featured Cars', `Are you sure you want to add "${car.carname}" to featured cars?`, () => {
      this.submitting = true;
      this.homeService.addFeaturedCar(car._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.showSuccessDialog(response.message);
            this.loadFeaturedCarsData();
          } else {
            this.showErrorDialog(response.message);
          }
        },
        error: (error) => {
          console.error('Error adding car to featured:', error);
          this.showErrorDialog('Failed to add car to featured cars');
        },
        complete: () => {
          this.submitting = false;
        }
      });
    });
  }

  removeFromFeaturedCars(carId: string, carName: string): void {
    if (!carId) {
      console.error('Cannot remove featured car: carId is undefined');
      this.showErrorDialog('Cannot remove car: Invalid car ID');
      return;
    }
    
    this.showConfirmDialog('Remove from Featured Cars', `Are you sure you want to remove "${carName}" from featured cars?`, () => {
      this.submitting = true;
      this.homeService.removeFeaturedCar(carId).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.showSuccessDialog(response.message);
            this.loadFeaturedCarsData();
          } else {
            this.showErrorDialog(response.message);
          }
        },
        error: (error) => {
          console.error('Error removing car from featured:', error);
          this.showErrorDialog('Failed to remove car from featured cars');
        },
        complete: () => {
          this.submitting = false;
        }
      });
    });
  }

  // TrackBy function for featured cars to improve performance
  trackByFeaturedCarId(index: number, featuredCar: FeaturedCar): string {
    return featuredCar._id || featuredCar.carId?._id || index.toString();
  }

  // ==================== ABOUT METHODS ====================

  loadAbouts(): Promise<void> {
    return new Promise((resolve) => {
      this.homeService.getAbout().subscribe({
        next: (response) => {
          if (response.status === 'success' && response.body.about) {
            this.abouts = Array.isArray(response.body.about) ? response.body.about : [response.body.about];
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading about content:', error);
          this.showErrorDialog('Failed to load about content');
          resolve();
        }
      });
    });
  }

  onAboutImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedAboutImage = file;
    }
  }

  saveAboutContent(): void {
    this.submitting = true;

    const formData = new FormData();
    
    if (this.aboutForm.aboutherotext) {
      formData.append('aboutherotext', this.aboutForm.aboutherotext);
    }
    if (this.aboutForm.aboutherosubtext) {
      formData.append('aboutherosubtext', this.aboutForm.aboutherosubtext);
    }
    if (this.aboutForm.aboutheroimage) {
      formData.append('aboutheroimage', this.aboutForm.aboutheroimage);
    }
    if (this.selectedAboutImage) {
      formData.append('aboutheroimage', this.selectedAboutImage);
    }

    const operation = this.editingAboutId 
      ? this.homeService.updateAbout(this.editingAboutId, formData)
      : this.homeService.createAbout(formData);

    operation.subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.showSuccessDialog(response.message);
          this.cancelEditAbout();
          this.loadAbouts();
        } else {
          this.showErrorDialog(response.message);
        }
      },
      error: (error) => {
        console.error('Error saving about content:', error);
        this.showErrorDialog('Failed to save about content');
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  editAbout(about: About): void {
    this.editingAbout = about;
    this.editingAboutId = about._id!;
    this.aboutForm = { ...about };
    this.selectedAboutImage = null;
  }

  cancelEditAbout(): void {
    this.editingAbout = null;
    this.editingAboutId = null;
    this.aboutForm = {};
    this.selectedAboutImage = null;
    this.showAddAboutForm = false;
  }

  deleteAbout(about: About): void {
    this.showConfirmDialog('Delete About Content', `Are you sure you want to delete this about content?`, () => {
      this.submitting = true;
      this.homeService.deleteAbout(about._id!).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.showSuccessDialog(response.message);
            this.loadAbouts();
          } else {
            this.showErrorDialog(response.message);
          }
        },
        error: (error) => {
          console.error('Error deleting about content:', error);
          this.showErrorDialog('Failed to delete about content');
        },
        complete: () => {
          this.submitting = false;
        }
      });
    });
  }
}