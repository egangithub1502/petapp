import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import { NgxPaginationModule } from 'ngx-pagination';
import * as L from 'leaflet';
import { CommonService } from '../../services/common/common.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ImageModule } from 'primeng/image';
import { AllpetmanagementComponent } from '../allpetmanagement/allpetmanagement.component';
import { MypetmanagementComponent } from '../mypetmanagement/mypetmanagement.component';
@Component({
  selector: 'app-dashboardpage',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, ModalModule, NgxSpinnerModule, ImageModule,AllpetmanagementComponent,MypetmanagementComponent],
  templateUrl: './dashboardpage.component.html',
  styleUrl: './dashboardpage.component.scss'
})
export class DashboardpageComponent {
  all_pet_details: any = []
  my_pet_details: any = []

  all_pet_status: any = true
  my_pet_status: any = false

  allpetpage: number = 1;
  allpettotal: number = 0;

  mypetpage: number = 1;
  mypettotal: number = 0;
  itemperpage: any = 10

  //add report
  map!: L.Map;
  marker!: L.Marker;


  selectedFile!: File;
  petreportdetails: any = {
    lastsightlocation: {
      lat: 12.9716, lng: 77.5946
    }
  }

  selected_allpetdetails: any = {}

  constructor(private commonService: CommonService, private spinner: NgxSpinnerService) { }
  ngOnInit(): void {

 
    this.getallpetdata()
    this.getmypetdata()
  }

  getallpetdata() {
    this.commonService.getRequest('users/get_all_pet_reports').then((allpetres: any) => {
      this.all_pet_details = allpetres.data
      this.allpettotal = allpetres.data.length
    }).catch((_allpetreserror: any) => {
      this.all_pet_details = []
      this.allpettotal = 0
    })
  }
  getmypetdata() {
    this.commonService.getRequest('users/get_my_pet_reports').then((mypetres: any) => {

      this.my_pet_details = mypetres.data
      this.mypettotal = mypetres.data.length
    }).catch((_mypetreserror: any) => {
      this.my_pet_details = []
      this.mypettotal = 0
    })
  }
  allpetpageChangeEvent(event: number) {
    this.allpetpage = event;
    this.getallpetdata();
  }
  mypetpageChangeEvent(event: number) {
    this.mypetpage = event;
    this.getmypetdata();
  }
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.petreportdetails.imagePreview = e.target?.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  submitReport(form: NgForm, modal: any): void {
    this.spinner.show()
    if (form.valid) {
      if (!this.selectedFile) {
        this.spinner.hide()
        this.commonService.alert('Error', 'Please select an pet image!')
        return;
      }
      const formData = new FormData();
      formData.append('image', this.selectedFile);
      formData.append('petname', this.petreportdetails.petname);
      formData.append('petdescription', this.petreportdetails.petdescription);
      formData.append('petbreed', this.petreportdetails.petbreed);
      formData.append('petage', this.petreportdetails.petage);
      formData.append('locationlat', this.petreportdetails.lastsightlocation.lat);
      formData.append('locationlng', this.petreportdetails.lastsightlocation.lng);
      this.commonService.postFileRequest('users/report_pet_missing', formData).then((petreposrtresponse: any) => {
        if (petreposrtresponse.status) {
          this.commonService.alert('Success', petreposrtresponse.message)
        } else {
          this.commonService.alert('Error', petreposrtresponse.message)
        }
        this.spinner.hide()
        form.resetForm()
        this.getmypetdata();
        modal.hide()
      }).catch((petreporterror: any) => {
        this.spinner.hide()
        this.commonService.alert('Error', petreporterror)
      })
    } else {
      this.spinner.hide()
      this.commonService.alert('Error', 'Invalid input field')
    }
  }

}
