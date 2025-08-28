import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DialogModule } from "primeng/dialog";
import { FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from "@angular/common";
import { DividerModule } from "primeng/divider";
import { FirebaseService } from "../../services/firebase.service";
import { catchError, of, take, tap } from "rxjs";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";


@Component({
  standalone: true,
  selector: 'update-image-modal',
  templateUrl: './updateImageModal.component.html',
  styleUrls: ['./updateImageModal.component.css'],
  imports: [DialogModule, FileUploadModule, ButtonModule, CommonModule, DividerModule, ToastModule],
})
export class UpdateImageModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onImageUpdate = new EventEmitter<string>();

  uploadedImage: File | undefined;
  uploadedImageB64: string = '';

  loading: boolean = false;

  constructor(private firebaseService: FirebaseService, private messageService: MessageService) {}

  onFileSelected(input: FileUploadHandlerEvent) {
    if (input.files.length == 1) {
      const file = input.files[0];
      if (!file.type.includes('image/')) return;
      this.uploadedImage = file;
      const reader = new FileReader();
      reader.readAsDataURL(file); 
      reader.onload = (_event) => { 
          this.uploadedImageB64 = reader.result?.toString() ?? ''; 
      }
    }
  }

  onFileDeleted() {
    this.uploadedImageB64 = '';
    this.uploadedImage = undefined;
  }

  closeModal() {
    this.visibleChange.emit(false);
  }

  updateImage() {
    this.loading = true;
    if (this.uploadedImage) {
      this.firebaseService.updateUserImage(this.uploadedImage).pipe(
        tap( url => {
            this.loading = false;
            this.onImageUpdate.emit(url);
            this.visibleChange.emit(false);
        }),
        take(1),
        catchError(_ => {
          this.loading = false;
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Something went wrong. Try again later or contact the administrator.', 
            life: 3000, 
            closable: true 
          });
          return of()
        })
      ).subscribe();
    }
    else {
      this.firebaseService.deleteUserImage().pipe(
        tap( () => {
            this.loading = false;
            this.onImageUpdate.emit('');
            this.visibleChange.emit(false);
        }),
        take(1),
        catchError( error => {
          this.loading = false;
          if (error.code != 'storage/object-not-found') {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: 'Something went wrong. Try again later or contact the administrator.', 
              life: 3000, 
              closable: true 
            });
          } else this.visibleChange.emit(false);
          return of()
        })
      ).subscribe();
    }
  }
}