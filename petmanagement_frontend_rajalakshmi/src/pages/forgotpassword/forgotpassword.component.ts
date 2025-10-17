import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { CommonService } from '../../services/common/common.service';

@Component({
  selector: 'app-forgotpassword',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSpinnerModule],
  templateUrl: './forgotpassword.component.html',
  styleUrl: './forgotpassword.component.scss'
})
export class ForgotpasswordComponent {
  useremail: any = ''
  constructor(public commonService: CommonService, private spinner: NgxSpinnerService) {

  }
  onSubmit(fwform: NgForm) {
    this.spinner.show()
    if (fwform.valid) {
      this.commonService.postRequest('users/forgot_password', { useremail: this.useremail }).then((fwresponse: any) => {
        if (fwresponse.status) {
          fwform.resetForm()
          this.commonService.alert('Success', fwresponse.message)
          this.spinner.hide()
          window.open(fwresponse.data, '_blank')
          this.commonService.redirectTo('/signin')
        } else {
          this.spinner.hide()
          this.commonService.alert('Error', fwresponse.message)
        }
      }).catch((fwperr: any) => {
        this.spinner.hide()
        this.commonService.alert('Error', fwperr.message)
      })
    } else {
      this.spinner.hide()
      this.commonService.alert('Error', 'Invalid input field')

    }
  }
}
