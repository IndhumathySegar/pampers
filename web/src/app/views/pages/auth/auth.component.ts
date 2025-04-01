// Angular
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'

// Layout
import { LayoutConfigService, SplashScreenService, TranslationService } from '../../../core/_base/layout';
// Auth
import { AuthNoticeService } from '../../../core/auth';
import { environment } from '@env/environment'

@Component({
	selector: 'kt-auth',
	templateUrl: './auth.component.html',
	styleUrls: ['./auth.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class AuthComponent implements OnInit {
	// Public properties
	today: number = Date.now();
	headerLogo: string;
	version = ''
	logout = false;
	/**
	 * Component constructor
	 *
	 * @param el
	 * @param render
	 * @param layoutConfigService: LayoutConfigService
	 * @param authNoticeService: authNoticeService
	 * @param translationService: TranslationService
	 * @param splashScreenService: SplashScreenService
	 */
	constructor(
		private layoutConfigService: LayoutConfigService,
		public authNoticeService: AuthNoticeService,
		public router: Router,
		private translationService: TranslationService,
		private splashScreenService: SplashScreenService,
		public activatedRoute: ActivatedRoute
	) { }

	/**
	 * On init
	 */
	ngOnInit(): void {
		const pageUrl = this.activatedRoute.snapshot['_routerState'].url;
		if (pageUrl.includes('/logout')) {
			this.logout = true;
		}
		this.version = environment.version;
		this.translationService.setLanguage(this.translationService.getSelectedLanguage());
		this.headerLogo = this.layoutConfigService.getLogo();

		this.splashScreenService.hide();
	}
}
