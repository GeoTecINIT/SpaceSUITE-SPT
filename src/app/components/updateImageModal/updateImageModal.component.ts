import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DialogModule } from "primeng/dialog";
import { FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from "@angular/common";
import { DividerModule } from "primeng/divider";
import { FirebaseService } from "../../services/firebase.service";
import { concatMap, of, take, tap } from "rxjs";


@Component({
  standalone: true,
  selector: 'update-image-modal',
  templateUrl: './updateImageModal.component.html',
  styleUrls: ['./updateImageModal.component.css'],
  imports: [DialogModule, FileUploadModule, ButtonModule, CommonModule, DividerModule],
})
export class UpdateImageModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onImageUpdate = new EventEmitter<string>();

  uploadedImage: File | undefined;
  uploadedImageB64: string | undefined;

  loading: boolean = false;

  constructor(private firebaseService: FirebaseService) {}

  onFileSelected(input: FileUploadHandlerEvent) {
    if (input.files.length == 1) {
      const file = input.files[0];
      if (!file.type.includes('image/')) return;
      this.uploadedImage = file;
      const reader = new FileReader();
      reader.readAsDataURL(file); 
      reader.onload = (_event) => { 
          this.uploadedImageB64 = reader.result?.toString() ?? undefined; 
      }
    }
  }

  onFileDeleted() {
    this.uploadedImageB64 = undefined;
    this.uploadedImage = undefined;
  }

  closeModal() {
    this.visibleChange.emit(false);
  }

  updateImage() {
    this.loading = true;
    this.firebaseService.updateUserImage(this.uploadedImage!).pipe(
        tap( url => {
            this.loading = false;
            this.onImageUpdate.emit(url);
            this.visibleChange.emit(false);
        }),
        take(1)
    ).subscribe();
  }
}