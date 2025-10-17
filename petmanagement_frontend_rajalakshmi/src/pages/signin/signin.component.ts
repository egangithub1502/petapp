import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonService } from '../../services/common/common.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSpinnerModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss'
})
export class SigninComponent {
  user: any = {};
  constructor(public commonService: CommonService, private spinner: NgxSpinnerService) {

  }
  onSubmit(signinForm: NgForm): void {
    this.spinner.show()
    if (signinForm.valid) {
      this.commonService.postRequest('users/signin', this.user).then((signinresponse: any) => {
        if (signinresponse.status) {
          this.commonService.loginstatus.next(true)
          sessionStorage.setItem('key', signinresponse.token)
          sessionStorage.setItem('loginstatus', 'true')

          this.commonService.alert('Success', signinresponse.message)
          this.spinner.hide()
          this.commonService.redirectTo('/dashboard')
        } else {
          this.spinner.hide()
          this.commonService.alert('Error', signinresponse.message)
        }
      }).catch((signuperr: any) => {
        this.spinner.hide()
        this.commonService.alert('Error', signuperr.message)
      })
    } else {
      this.spinner.hide()
      this.commonService.alert('Error', 'Invalid input field')

    }
  }
}
