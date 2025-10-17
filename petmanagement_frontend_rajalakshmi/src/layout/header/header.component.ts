import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Injectable } from '@angular/core';
import { ModalModule } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ModalModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  loginstatus: any
  isBrowser: any;

  constructor(public commonService: CommonService, @Inject(PLATFORM_ID) platformId: Object,) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.commonService.loginstatus.subscribe((loginstatusres: any) => {
      this.loginstatus = loginstatusres
    })

  }
  ngOnInit() {
    this.checktrx()

  }
  checktrx() {
    if (this.isBrowser) {
      if (sessionStorage && sessionStorage?.getItem('loginstatus') == 'true' && sessionStorage?.getItem('key')) {
        this.commonService.redirectTo('/dashboard')
        this.loginstatus = true
      }
    } 
  }
  logoutconfirm(logoutmodal: any) {
    sessionStorage.clear()
    this.commonService.loginstatus.next(false)

    logoutmodal.hide()
    this.commonService.redirectTo('/signin')
  }

}
