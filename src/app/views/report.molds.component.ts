﻿import { Component, Input, Output } from "@angular/core";
import { Http } from "@angular/http";
import { Config, URL } from "../config";
import { ReportBaseComponent } from "./report.base.component";
import { DrawStackedChart } from "../utils/draw-stacked-chart";
import { DrawCategorizedStackedChart } from "../utils/draw-categorized-stacked-chart";
import { DrawPieChart } from "../utils/draw-pie-chart";

@Component({
	selector: "ichen-report-molds",
	template: `
		<div *ngIf="!isDenied && !isInitializing">
			<ichen-report-header [i18n]="i18n"
				[disabled]="isBusy"
				[collapsed]="collapseHeader"
				[title]="title"
				[useDateRange]="true"
				[controllersList]="controllersList"
				(run)="runReportAsync($event)"
			></ichen-report-header>

			<div id="chartContainer" class="card card-body" [hidden]="!showChart || isError || isDenied">
				<div id="chartCanvas" [hidden]="isBusy"></div>

				<div id="imgLoading" *ngIf="isBusy" class="text-center">
					<img src="/images/loading.gif" />
				</div>
			</div>
		</div>

		<div id="imgLoading" *ngIf="isInitializing">
			<img src="/images/loading.gif" />
		</div>

		<div id="imgError" *ngIf="isError">
			<p><img src="/images/alert.png" /></p>
			<h2>{{i18n.textError}}</h2>
		</div>

		<div id="imgNoAuthority" *ngIf="isDenied">
			<p><img src="/images/stopsign.png" /></p>
			<h2>{{i18n.textNoAuthority}}</h2>
		</div>
	`
})
export class MoldsReportComponent extends ReportBaseComponent<ITimeRangeValuesByControllers | ITimeRangeValues[]>
{
	public showChart = false;
	public collapseHeader = false;

	constructor(http: Http) { super(http); }

	public get i18n() { return Config.i18n; }

	public get title() { return this.i18n["titleMolds"] as string; }

	private compareMolds(a: string, b: string)
	{
		switch (a) {
			case "": a = "\uFFFF"; break;
			case "NoValue": a = "\uFFFE"; break;
		}
		switch (b) {
			case "": b = "\uFFFF"; break;
			case "NoValue": b = "\uFFFE"; break;
		}

		return (a < b) ? -1 : (a > b) ? 1 : 0;
	}

	private formatMold(category: string, i18n: ITranslationDictionary)
	{
		if (category === "") return i18n["labelNone"] as string;
		if (category === "NoValue") return i18n["labelNoValue"] as string;
		return category;
	}

	public async runReportAsync(parameters: IRunReportParameters)
	{
		this.clearChart();
		this.collapseHeader = false;

		const controllerId = parameters.controllerId;

		let url = URL.eventsReport;
		url = url.replace("{0}", parameters.byMachine ? "" : controllerId.toString())
			.replace("{1}", "Mold")
			.replace("//", "/");

		url += "?timezone=" + Config.timeZone + "&from=" + parameters.lower + "&to=" + parameters.upper;

		if (parameters.step !== undefined) url += "&step=" + parameters.step;

		this.showChart = true;

		await this.loadAsync(url);

		this.collapseHeader = true;

		if (!this.data) return;

		const timerange = parameters.from.substr(0, 10) + " - " + parameters.to.substr(0, 10);

		if (Array.isArray(this.data)) {
			if (this.data.length <= 0) {
				console.error("Chart has no data!");
			} else if (this.data.length <= 1) {
				DrawPieChart(this.title, Config.chartCanvasId, controllerId, timerange, this.data[0], this.i18n, this.compareMolds, this.formatMold);
			} else {
				DrawStackedChart(this.title, Config.chartCanvasId, controllerId, timerange, this.data, this.i18n, this.compareMolds, this.formatMold, !!parameters.monthOnly);
			}
		} else {
			DrawCategorizedStackedChart(this.title, Config.chartCanvasId, timerange, this.data, this.i18n, this.compareMolds, this.formatMold);
		}
	}
}
