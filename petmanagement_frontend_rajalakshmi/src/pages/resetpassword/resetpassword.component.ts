import { Component } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-resetpassword',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSpinnerModule],
  templateUrl: './resetpassword.component.html',
  styleUrl: './resetpassword.component.scss'
})
export class ResetpasswordComponent {
  resetdata: any = {}
  token: any
  constructor(public commonService: CommonService, private spinner: NgxSpinnerService, private route: ActivatedRoute) { }
  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
  }
  onSubmit(resetform: NgForm): void {
    this.spinner.show()
    if (resetform.valid) {
      if (this.resetdata.password !== this.resetdata.confirmPassword) {
        this.spinner.hide()
        this.commonService.alert('Error', 'Password do not match')
        return;
      }
      this.commonService.postRequest('users/reset_password',{token:this.token,password: this.resetdata.password}).then((resetresponse: any) => {
        if (resetresponse.status) {
          this.commonService.alert('Success', resetresponse.message)
          this.spinner.hide()
          this.commonService.redirectTo('/signin')
        } else {
          this.spinner.hide()
          this.commonService.alert('Error', resetresponse.message)
        }
      }).catch((reseterr: any) => {
        this.spinner.hide()
        this.commonService.alert('Error', reseterr.message)
      })
    } else {
      this.spinner.hide()
      this.commonService.alert('Error', 'Invalid input field')
    }
  }
}
