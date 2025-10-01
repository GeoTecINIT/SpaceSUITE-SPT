import { Injectable } from "@angular/core";
import { UserPortfolio } from "../model/userPortfolio";
import { catchError, concatMap, from, Observable, of } from "rxjs";
import { EuropassStrategy, WhiteEuropassStrategy } from "../model/europassStrategies";
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from "pdfjs-dist";

@Injectable({
    providedIn: 'root',
})
export class EuropassService {

	private strategy: EuropassStrategy;
	private strategies: EuropassStrategy[] = []

	constructor() {
		GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.js';
		this.strategies.push(new WhiteEuropassStrategy());
		this.strategy = this.strategies[0];
	}

	public parseUserPortfolio(arrayBuffer: ArrayBuffer): Observable<UserPortfolio> {
		return from(this.chooseStrategy(arrayBuffer)).pipe(
			concatMap((pdf: PDFDocumentProxy) => this.strategy.extractData(pdf)),
			catchError(() => of(new UserPortfolio()))
		);
	}

	private async chooseStrategy(arrayBuffer: ArrayBuffer) {
		const pdf = await getDocument({ data: arrayBuffer }).promise;

		const data = await pdf.getData();
		const text = new TextDecoder("utf-8").decode(data);

		// Check if is a Europass CV
		const matchEuropass = text.match(/europass/i); // case-insensitive
		const metadata = await pdf.getMetadata();
		const title = (metadata.info as Record<string, any>)["Title"];
		if (!matchEuropass || title !== "Europass") throw new Error("Unsupported CV template");

		// Choose strategy
		const match = text.match(/Template(\d+)/);
		const template = match ? match[1] : null;

		const newStrategy = this.strategies.find(value => value.templateId == template);
		if (newStrategy != undefined) this.strategy = newStrategy;
		else throw new Error("Unsupported CV template");
	
		return pdf
	}
}