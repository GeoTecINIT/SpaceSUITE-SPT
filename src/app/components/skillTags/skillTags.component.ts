import { CommonModule } from '@angular/common';
import {Component, Input} from '@angular/core';
import { TagModule } from 'primeng/tag';
import { Tag } from '../../model/tag'
import { BokInformationService } from '@eo4geo/ngx-bok-visualization';
import { UtilsService } from '../../services/utils.service';
import { map, Observable } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  standalone: true,
  selector: 'skill-tags',
  templateUrl: './skillTags.component.html',
  styleUrls: ['./skillTags.component.css'],
  imports: [CommonModule, TagModule, TooltipModule],
})
export class SkillTagComponent {
  @Input() tags: Tag[] = [];
  @Input() reverse: boolean = false;

  constructor(private bokInfo: BokInformationService, private utilsService: UtilsService) {}

  getBokColor(concept: string): Observable<string> {
    return this.bokInfo.getConceptColor(concept).pipe(
      map(color => color ? this.utilsService.convertHexToRgba(color, 0.5) : '')
    );
  }

  getBoKTooltip(concept: string): Observable<string> {
    return this.bokInfo.getConceptName(concept).pipe(
      map(tooltip => tooltip ? tooltip : 'Deprecated concept')
    );
  }

  getTooltipClass(concept: string): Observable<string> {
    return this.getBoKTooltip(concept).pipe(
      map(tooltip => tooltip == 'Deprecated concept' ? 'custom-p-tooltip-text' : '')
    );
  }

  onClickConcept(code: string) {
    window.open('https://bok.eo4geo.eu/' + code);
  }
}