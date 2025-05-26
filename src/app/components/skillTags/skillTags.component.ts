import { CommonModule } from '@angular/common';
import {Component, Input} from '@angular/core';
import { TagModule } from 'primeng/tag';
import { Tag } from '../../model/tag'

@Component({
  standalone: true,
  selector: 'skill-tags',
  templateUrl: './skillTags.component.html',
  styleUrls: ['./skillTags.component.css'],
  imports: [CommonModule, TagModule],
})
export class SkillTagComponent {
  @Input() tags: Tag[] = [];
  @Input() reverse: boolean = true;
}