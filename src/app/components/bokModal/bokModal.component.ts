import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ComponentRef, EventEmitter, Input, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { BokComponent, BokInformationService } from '@eo4geo/ngx-bok-visualization';
import { ButtonModule } from "primeng/button";
import { DialogModule } from 'primeng/dialog';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { UtilsService } from '../../services/utils.service';

@Component({
  standalone: true,
  selector: 'bokModal',
  templateUrl: './bokModal.component.html',
  styleUrls: ['./bokModal.component.css'],
  imports: [DialogModule, ButtonModule, ChipModule, CommonModule, TooltipModule],
})
export class BokModalComponent {
  visible = false;
  
  @Input() label: string = 'BoK Concepts';
  @Input() disabled: boolean = false;

  currentConcept = '';
  currentConceptName = '';

  @Input() selectedConcepts: string[] = [];
  selectedConceptsColor: Map<string, string> = new Map();
  selectedConceptsTooltip: Map<string, string> = new Map();
  @Output() selectedConceptsChange: EventEmitter<string[]> = new EventEmitter();

  @ViewChild('dynamicContainer', { read: ViewContainerRef }) container!: ViewContainerRef;

  private componentRef: ComponentRef<BokComponent> | null = null;

  constructor(private readonly bokInfo: BokInformationService, private readonly utilsService: UtilsService, 
              private cdr: ChangeDetectorRef){}

  ngOnInit() {
    this.selectedConcepts.forEach( concept => {
      this.bokInfo.getConceptColor(concept).subscribe(
        color => {
          const softColor = color ? this.utilsService.convertHexToRgba(color, 0.5) : '';
          this.selectedConceptsColor.set(concept, softColor)
        }
      )
      this.bokInfo.getConceptName(concept).subscribe(
        tooltip => this.selectedConceptsTooltip.set(concept, tooltip)
      );
    })
  }

  showDialog() {
    this.visible = true;
  }

  async loadComponent() {
    if (this.componentRef) return;
    this.container.clear();
    const { BokComponent } = await import('@eo4geo/ngx-bok-visualization');
    this.componentRef = this.container.createComponent(BokComponent);
    this.componentRef.setInput('showDescription', false);
    this.componentRef.setInput('showVersions', false);
    this.componentRef.setInput('showSearchEngine', true);
    this.componentRef.instance.codSelectedChange.subscribe((newCode: string) => {
      this.currentConcept = newCode;
      this.bokInfo.getConceptName(newCode).subscribe(name => this.currentConceptName = name);
      this.cdr.detectChanges();
    })
  }

  addConcept() {
    this.addConceptWithName(this.currentConcept);
  }

  addConceptWithName(concept: string) {
    if (!this.selectedConcepts.includes(concept)) {
      this.selectedConcepts.push(concept);
      this.bokInfo.getConceptColor(concept).subscribe(
        color => {
          const softColor = color ? this.utilsService.convertHexToRgba(color, 0.5) : '';
          this.selectedConceptsColor.set(concept, softColor)
        }
      )
      this.bokInfo.getConceptName(concept).subscribe(
        tooltip => this.selectedConceptsTooltip.set(concept, tooltip)
      );
      this.selectedConceptsChange.emit(this.selectedConcepts);
    }
  }

  removeChip(label: string) {
    this.selectedConcepts = this.selectedConcepts.filter(concept => concept != label);
    this.selectedConceptsColor.delete(label);
    this.selectedConceptsTooltip.delete(label);
    this.selectedConceptsChange.emit(this.selectedConcepts);
  }
}