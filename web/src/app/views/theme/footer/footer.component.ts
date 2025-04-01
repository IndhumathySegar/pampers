// Angular
import { Component, OnInit } from '@angular/core';
// Layout
import { LayoutConfigService } from '../../../core/_base/layout';
// Object-Path
import * as objectPath from 'object-path';
import { environment } from '@env/environment';

@Component({
	selector: 'kt-footer',
	templateUrl: './footer.component.html',
})
export class FooterComponent implements OnInit {
	// Public properties
	today: number = Date.now();
	fluid: boolean;
	version = '';

	constructor(
		private readonly layoutConfigService: LayoutConfigService
	) { }

	ngOnInit(): void {
		this.version = environment.version;
		const config = this.layoutConfigService.getConfig();

		// footer width fluid
		this.fluid = objectPath.get(config, 'footer.self.width') === 'fluid';
	}
}
