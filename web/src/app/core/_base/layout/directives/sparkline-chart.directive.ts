// Angular
import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';
// Chart
import { Chart } from 'chart.js/dist/Chart.min.js';
// LayoutConfig
import { LayoutConfigService } from '../../layout/services/layout-config.service';

export interface SparklineChartOptions {
	// array of numbers
	data: number[];
	// chart line color
	color: string;
	// chart line size
	border: number;
	fill?: boolean;
	tooltip?: boolean;
}

/**
 * Configure sparkline chart
 */
@Directive({
	selector: '[ktSparklineChart]',
	exportAs: 'ktSparklineChart'
})
export class SparklineChartDirective implements AfterViewInit {
	// Public properties
	@Input() options: SparklineChartOptions;
	// Private properties
	private chart: Chart;

	/**
	 * Directive Constructor
	 *
	 * @param el: ElementRef
	 * @param layoutConfigService: LayoutConfigService
	 */
	constructor(private el: ElementRef, private layoutConfigService: LayoutConfigService) {
	}

	/**
	 * After view init
	 */
	ngAfterViewInit(): void {
		this.initChart(this.el.nativeElement, this.options.data, this.options.color, this.options.border);
	}

	/**
	 * Init chart
	 * @param src: any
	 * @param data: any
	 * @param color: any
	 * @param border: any
	 * @param fill: any
	 * @param tooltip: any
	 */
	initChart(src, data, color, border) {
		if (src.length === 0) {
			return;
		}

		const config = {
			type: 'line',
			data: {
				labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'],
				datasets: [{
					label: '',
					borderColor: color,
					borderWidth: border,

					pointHoverRadius: 4,
					pointHoverBorderWidth: 12,
					pointBackgroundColor: Chart.helpers.color('#000000').alpha(0).rgbString(),
					pointBorderColor: Chart.helpers.color('#000000').alpha(0).rgbString(),
					pointHoverBackgroundColor: this.layoutConfigService.getConfig('colors.state.danger'),
					pointHoverBorderColor: Chart.helpers.color('#000000').alpha(0.1).rgbString(),
					fill: false,
					data,
				}]
			},
			options: {
				title: {
					display: false,
				},
				tooltips: {
					enabled: false,
					intersect: false,
					mode: 'nearest',
					xPadding: 10,
					yPadding: 10,
					caretPadding: 10
				},
				legend: {
					display: false,
					labels: {
						usePointStyle: false
					}
				},
				responsive: true,
				maintainAspectRatio: true,
				hover: {
					mode: 'index'
				},
				scales: {
					xAxes: [{
						display: false,
						gridLines: false,
						scaleLabel: {
							display: true,
							labelString: 'Month'
						}
					}],
					yAxes: [{
						display: false,
						gridLines: false,
						scaleLabel: {
							display: true,
							labelString: 'Value'
						},
						ticks: {
							beginAtZero: true
						}
					}]
				},

				elements: {
					point: {
						radius: 4,
						borderWidth: 12
					},
				},

				layout: {
					padding: {
						left: 0,
						right: 10,
						top: 5,
						bottom: 0
					}
				}
			}
		};

		this.chart = new Chart(src, config);
	}

	/**
	 * Returns the chart
	 */
	getChart() {
		return this.chart;
	}
}
