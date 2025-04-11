import {Component} from '@angular/core';
import { BokComponent } from '@eo4geo/ngx-bok-visualization';

@Component({
  standalone: true,
  selector: 'main-page',
  templateUrl: './mainPage.component.html',
  styleUrls: ['./mainPage.component.css'],
  imports: [BokComponent],
})
export class MainPageComponent {

}