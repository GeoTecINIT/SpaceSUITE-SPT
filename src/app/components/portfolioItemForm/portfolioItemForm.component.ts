import { CommonModule } from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import { Country, PortfolioItem } from '../../model/userPortfolio';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from "primeng/inputtext";
import { FloatLabelModule } from "primeng/floatlabel";
import { FormsModule } from "@angular/forms";
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from "primeng/tooltip";
import { DatePickerModule } from 'primeng/datepicker';
import { take } from 'rxjs';
import { TextChipsComponent } from '../textChips/textChips.component';
import { SelectModule } from 'primeng/select';
import { FormDataService } from '../../services/formData.service';
import { BokModalComponent } from "../bokModal/bokModal.component";

@Component({
  standalone: true,
  selector: 'portfolio-item-form',
  templateUrl: './portfolioItemForm.component.html',
  styleUrls: ['./portfolioItemForm.component.css'],
  imports: [InputTextModule, FloatLabelModule, FormsModule, InputIconModule, IconFieldModule, TextareaModule, CommonModule, SelectModule,
    ButtonModule, DatePickerModule, TooltipModule, TextChipsComponent, BokModalComponent]
})
export class PortfolioItemFormComponent {

  @Input() portfolioItem: PortfolioItem = new PortfolioItem();
  @Output() portfolioItemChange: EventEmitter<PortfolioItem> = new EventEmitter();
  @Input() errorMap: Map<string, string | undefined> = new Map();
  @Input() index: string = 'E1';
  countryList: Country[] = [];
  cityList: string[] = [];
  loadingCities: boolean = false;
  loadingCountries: boolean = true;

  constructor(private formDataService: FormDataService){}

  ngOnInit() {
    this.formDataService.getCountries().pipe(take(1)).subscribe( countries => {
        this.countryList = countries;
        this.loadingCountries = false;
      }
    )
    if (this.portfolioItem.country) this.updateCityList(this.portfolioItem.country);
  }

  updateCityList(country: Country) {
    this.cityList = [];
    this.loadingCities = true;
    this.formDataService.getCities(country.iso2).pipe(take(1)).subscribe(
      cities => {
        this.cityList = cities;
        this.loadingCities = false;
      }
    )
  }

}