// Angular
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// RXJS
import { Subscription } from 'rxjs';
// Layout
import { LayoutConfigService } from '../../../../core/_base/layout';
import { Store } from '@ngrx/store';

import { AppState } from "../../../../core/reducers";
import { currentUser } from "../../../../core/auth/_selectors/auth.selectors";
import { environment } from '../../../../../environments/environment';

@Component({
	selector: 'kt-error-page',
	templateUrl: './error-page.component.html',
	styleUrls: ['./error-page.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class ErrorPageComponent implements OnInit, OnDestroy {
	accessUrl = ''
	// Public properties
	// type of error template to be used, accepted values; error-v1 | error-v2 | error-v3 | error-v4 | error-v5 | error-v6
	@Input() type = 'error-v1';
	// full background image
	@Input() image: string;
	// error code, some error types template has it
	@Input() code = '404';
	// error title
	@Input() title: string;
	// error subtitle, some error types template has it
	@Input() subtitle: string;
	// error descriptions
	@Input() desc = 'Oops! Something went wrong!';
	// return back button title	
	@Input() return = 'Return back';

	private sub: Subscription;

	public user: any = {};

	public userToken = '';

	/**
	 * Component constructor
	 *
	 * @param route: ActivatedRoute
	 * @param layoutConfigService: LayoutConfigService
	 */
	constructor(private route: ActivatedRoute, private layoutConfigService: LayoutConfigService,
		public router: Router, public store: Store<AppState>) {
		// set temporary values to the layout config on this page
		// this.layoutConfigService.setConfig({ self: { layout: 'blank' } });
		this.accessUrl = localStorage.getItem('access-url')
	}

	/**
	 * @ Lifecycle sequences => https://angular.io/guide/lifecycle-hooks
	 */

	/**
	 * On init
	 */
	ngOnInit() {
		this.userToken = localStorage.getItem(environment.authTokenKey);
		this.store.select(currentUser).subscribe(user => {
			this.user = user;
		})
		this.type = this.route.snapshot.paramMap.get('type');
		this.sub = this.route.data.subscribe(param => {
			if (param.type) {
				this.type = param.type;
			}
			if (param.image) {
				this.image = param.image;
			}
			if (param.code) {
				this.code = param.code;
			}
			if (param.title) {
				this.title = param.title;
			}
			if (param.subtitle) {
				this.subtitle = param.subtitle;
			}
			if (param.desc) {
				this.desc = param.desc;
			}
			if (param.return) {
				this.return = param.return;
			}
		});
		this.init(this.type);
	}

	/**
	 * On destroy
	 */
	ngOnDestroy(): void {
		// reset config from any temporary values
		this.layoutConfigService.reloadConfigs();
		this.sub && this.sub.unsubscribe();
	}

	redirect() {
		console.log(this.user, 'this.user')
		console.log(this.user.landingPage, "landingPage")
		this.router.navigateByUrl(this.user.landingPage || "/");
	}

	init(type) {
		switch (type) {
			case 'error-v1':
				this.errorCase('error-v1', 'bg1');
				break;
			case 'error-v2':
				if (!this.desc) {
					this.desc = 'Something went wrong here';
				}
				this.errorCase('error-v2', 'bg2');
				this.setTitle('error-v2');
				break;
			case 'error-v3':
				if (!this.desc) {
					this.desc = 'There may be amisspelling in the URL entered,<br>' + 'or the page you are looking for may no longer exist.';
				}
				this.errorCase('error-v3', 'bg3');
				this.setTitle('error-v3');
				break;
			case 'error-v4':
				if (!this.desc) {
					this.desc = 'Nothing left to do here';
				}
				this.errorCase('error-v4', 'bg4');
				this.setTitle('error-v4');
				break;
			case 'error-v5':
				if (!this.desc) {
					this.desc = 'We\'re working on it and we\'ll get it fixed<br>' + 'as soon possible.<br>' + 'You can back or use our Help Center.';
				}
				this.errorCase('error-v5', 'bg5');
				this.setTitle('error-v5');
				break;
			case 'error-v6':
				if (!this.desc) {
					this.desc = 'Looks like something went wrong.<br>' + 'We\'re working on it';
				}
				this.errorCase('error-v6', 'bg6');
				this.setTitle('error-v6');
				break;
			default:
				if (!this.image) {
					this.image = './assets/media/error/bg1.jpg';
				}
		}
	}

	errorCase(type, img) {
		if (!this.image) {
			this.image = './assets/media/error/' + img + '.jpg';
		}
		if (!this.code) {
			this.code = '404';
		}
		if (!this.subtitle && type === 'error-v3' && type === 'error-v5') {
			this.subtitle = (type === 'error-v3') ? 'Sorry we can\'t seem to find the page you\'re looking for.' : 'Something went wrong here';
		}
	}

	setTitle(type) {
		if (!this.title) {
			if (type === 'error-v3') {
				this.title = 'How did you get here';
			} else if (type === 'error-v4') {
				this.title = 'ERROR';
			} else {
				this.title = 'Oops!';
			}
		}
	}
}
