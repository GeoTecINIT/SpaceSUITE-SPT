import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FloatLabelModule } from "primeng/floatlabel";
import { SelectModule } from 'primeng/select';
import { CEFRLevel, LanguageSkill } from "../../model/userPortfolio";
import { FormsModule } from "@angular/forms";
import { LanguageService } from "../../services/language.service";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";

@Component({
  standalone: true,
  selector: 'language-select',
  templateUrl: './languageSelect.component.html',
  styleUrls: ['./languageSelect.component.css'],
  imports: [CommonModule, FloatLabelModule, SelectModule, FormsModule, ButtonModule, DividerModule],
})
export class LanguageSelectComponent {
  @Input() languages: LanguageSkill[] = [];
  @Output() otherLanguagesChange: EventEmitter<LanguageSkill[]> = new EventEmitter();

  languageList: string[] = [];
  levelList: CEFRLevel[] = ['C2', 'C1', 'B2', 'B1', 'A2', 'A1'];

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    this.languageList = this.languageService.getLanguageList();
  }

  addLanguage() {
    const newLang = new LanguageSkill();
    newLang.language = this.languageList[0];
    this.languages.push(newLang)
  }

  deleteLanguage() {
    this.languages.pop();
  }
}