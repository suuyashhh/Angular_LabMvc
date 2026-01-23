import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

export interface BreedingAnimalSummaryDTO {
  animalId: number;
  animalName: string;
  totalBreedingRecords: number;
  lastBreedingDate: string | null;
  lastBreedingReason: string | null;
  status: string;
}

@Component({
  selector: 'app-cattle-breeding-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './cattle-breeding-calculator.component.html',
  styleUrls: ['./cattle-breeding-calculator.component.css']
})
export class CattleBreedingCalculatorComponent implements OnInit, OnDestroy {

  breedingForm!: FormGroup;

  animalOptions: BreedingAnimalSummaryDTO[] = [];
  selectedAnimal: BreedingAnimalSummaryDTO | null = null;

  dairyUserId = 0;
  loadingAnimals = false;

  cattleTypes = [
    { value: 'Cow', label: 'Cow', gestationMonths: 9, targetDays: 9 },
    { value: 'Buffalo', label: 'Buffalo', gestationMonths: 10, targetDays: 10 }
  ];

  private subs = new Subscription();

  constructor(
    private http: ApiService,
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {
    if (!this.auth.isDairyLoggedIn()) {
      this.router.navigate(['/dairyfarm']);
      return;
    }

    this.dairyUserId = this.getUserId();
    this.initForm();
    this.loadAnimals();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ✅ Local date string (prevents UTC shift)
  private toInputDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getUserId(): number {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    const id = dairy?.user_id ?? dairy?.userId ?? dairy?.UserId ?? dairy?.id;
    return Number(id) || 0;
  }

  initForm(): void {
    const todayStr = this.toInputDate(new Date());

    this.breedingForm = new FormGroup({
      animalId: new FormControl('', Validators.required),
      animalType: new FormControl('Cow', Validators.required),
      aiDate: new FormControl(todayStr, Validators.required),

      // ✅ ENABLED controls so UI can read values
      daysPregnant: new FormControl(0),
      expectedCalvingDate: new FormControl(''),
      targetDate: new FormControl('')
    });

    this.breedingForm.get('animalId')?.valueChanges.subscribe(id => this.onAnimalSelect(id));
    this.breedingForm.get('animalType')?.valueChanges.subscribe(() => this.calculateDates());
    this.breedingForm.get('aiDate')?.valueChanges.subscribe(() => this.calculateDates());
  }

  loadAnimals(): void {
    if (!this.dairyUserId) return;

    this.loadingAnimals = true;
    this.loader.show();

    const s = this.http.get(`BreedingDateCheck/animals/${this.dairyUserId}`)
      .pipe(finalize(() => {
        this.loadingAnimals = false;
        this.loader.hide();
      }))
      .subscribe({
        next: (res: any) => {
          this.animalOptions = Array.isArray(res) ? res : [];
          if (this.animalOptions.length) {
            this.breedingForm.patchValue({ animalId: this.animalOptions[0].animalId });
          }
        },
        error: () => this.toastr.error('Failed to load animals')
      });

    this.subs.add(s);
  }

  onAnimalSelect(animalId: number): void {
    const a = this.animalOptions.find(x => x.animalId === Number(animalId));
    this.selectedAnimal = a || null;

    if (a?.lastBreedingDate) {
      const localDate = this.toInputDate(new Date(a.lastBreedingDate));
      this.breedingForm.patchValue({ aiDate: localDate }, { emitEvent: false });
    }

    this.calculateDates();
  }

  calculateDates(): void {
    const type = this.breedingForm.get('animalType')?.value;
    const aiDateStr = this.breedingForm.get('aiDate')?.value;
    if (!type || !aiDateStr) return;

    const breedingDate = new Date(aiDateStr + 'T00:00:00');
    const today = new Date();

    const days = Math.max(
      Math.floor((today.getTime() - breedingDate.getTime()) / 86400000),
      0
    );

    const ct = this.cattleTypes.find(x => x.value === type);
    if (!ct) return;

    const calving = new Date(breedingDate);
    calving.setMonth(calving.getMonth() + ct.gestationMonths);

    const target = new Date(calving);
    target.setDate(target.getDate() + ct.targetDays);

    this.breedingForm.patchValue({
      daysPregnant: days,
      expectedCalvingDate: this.toInputDate(calving),
      targetDate: this.toInputDate(target)
    });
  }

  getTargetDays(): number {
    const type = this.breedingForm.get('animalType')?.value;
    const ct = this.cattleTypes.find(x => x.value === type);
    return ct ? ct.targetDays : 0;
  }

  // ✅ FULL MONTH DISPLAY
  formatDate(d: string): string {
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  goToAnimals(): void {
    this.router.navigate(['/dairyfarm/animals']);
  }

  navigateBack(): void {
    this.router.navigate(['/dairyfarm/webpage']);
  }
  getPregnancyMonthsDays(): string {

  const days = this.breedingForm.get('daysPregnant')?.value || 0;

  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  if (months === 0) {
    return `${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
  }

  return `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
}


}
