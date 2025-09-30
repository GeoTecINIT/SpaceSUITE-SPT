import {Component, EventEmitter, Input, Output} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { UserPortfolio } from '../../model/userPortfolio';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { Subscription } from 'rxjs';
import { EuropassService } from '../../services/europass.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'upload-cv-modal',
  templateUrl: './uploadCVModal.component.html',
  styleUrls: ['./uploadCVModal.component.css'],
  imports: [DialogModule, FileUploadModule, ProgressBarModule, CommonModule, ButtonModule],
})
export class UploadCVModalComponent {
    @Input() visible: boolean = false;
    @Output() visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    @Output() userPortfolioChange: EventEmitter<UserPortfolio> = new EventEmitter<UserPortfolio>()
    userPortfolio: UserPortfolio = new UserPortfolio();

    progress: number = 0;
    showProgressBar: boolean = false;

    private extractionSubscription: Subscription | null = null;

    constructor(private europassService: EuropassService) {}

    ngOnDestroy(): void {
      if (this.extractionSubscription) {
        this.extractionSubscription.unsubscribe();
      }
    }

    submitCV() {
      this.userPortfolioChange.emit(this.userPortfolio)
      this.visibleChange.emit(false);
    }

    async onFileSelected(input: FileSelectEvent) {
    if (input.files && input.files.length > 0) {
      this.onClear();
      const file = input.files[0];
      if (file.type != 'application/pdf') return;
      this.showProgressBar = true;
      this.progress = 0; // Reset progress

      // create a reader object
      const reader = new FileReader();

      // calculate the progress during file upload
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          this.progress = Math.round((event.loaded / event.total) * 100);
        }
      };

      reader.onloadend = async () => {
        this.progress = 99;
        const arrayBuffer = reader.result as ArrayBuffer;
        this.extractionSubscription = this.europassService.parseUserPortfolio(arrayBuffer).subscribe(
          portfolio => {
            this.userPortfolio = portfolio;
            this.progress = 100;
            this.showProgressBar = false;
          }
        );
      };

      // start reading the file
      reader.readAsArrayBuffer(file);
    }
  }

  onClear() {
    this.showProgressBar = false;
    this.progress = 0;
  }

  hasExtractedData(): boolean {
    return Boolean(
      this.userPortfolio.fullName ||
      this.userPortfolio.email ||
      this.userPortfolio.phoneCountryCode ||
      this.userPortfolio.phone ||
      this.userPortfolio.nativeLanguage ||
      (this.userPortfolio.languageSkills?.length)
    );
  }

}