import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NgxPaginationModule } from 'ngx-pagination';
import { CommonService } from '../../services/common/common.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ImageModule } from 'primeng/image';
import { ViewmapComponent } from '../viewmap/viewmap.component';

@Component({
  selector: 'app-allpetmanagement',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, ModalModule, NgxSpinnerModule, ImageModule, ViewmapComponent],
  templateUrl: './allpetmanagement.component.html',
  styleUrl: './allpetmanagement.component.scss'
})
export class AllpetmanagementComponent {
  all_pet_details: any = []
  all_pet_status: any = true
  allpetpage: number = 1;
  allpettotal: number = 0;
  itemperpage: any = 4

  selectedFile!: File;
  selected_allpetdetails: any = {
    lastsightlocation: {
      lat: 12.9716,
      lng: 77.5946
    }
  }
  contact_pet_details: any = {}

  constructor(private commonService: CommonService, private spinner: NgxSpinnerService) { }
  ngOnInit(): void {
    this.getallpetdata()
    this.updateItemsPerPage(window.innerWidth);

  }
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateItemsPerPage(event.target.innerWidth);
  }

  updateItemsPerPage(width: number) {
    if (width > 1024) {
      this.itemperpage = 4; // Large screens
    } else if (width > 600) {
      this.itemperpage = 2; // Medium screens
    } else {
      this.itemperpage = 1; // Small screens
    }
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
  getdata(dat: any) {
  }
  allpetpageChangeEvent(event: number) {
    this.allpetpage = event;
    this.getallpetdata();
  }
  submitcontactpet(contactpetmodal: any, helppetform: NgForm) {
    this.spinner.hide()
    this.commonService.postRequest('users/contact_pet_owner', { petid: this.selected_allpetdetails._id, description: this.contact_pet_details.contactdescription }).then((contactpetRes: any) => {
      if (contactpetRes.status) {
        contactpetmodal.hide()
        this.commonService.alert('Success', contactpetRes.message)
      } else {
        this.commonService.alert('Error', contactpetRes.message)
      }
      helppetform.resetForm()
      this.spinner.hide()
    }).catch((err: any) => {
      this.spinner.hide()
      this.commonService.alert('Error', 'Something went wrong. Please try again later!')

    })

  }
}
