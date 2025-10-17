import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NgxPaginationModule } from 'ngx-pagination';
import * as L from 'leaflet';
import { CommonService } from '../../services/common/common.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
@Component({
  selector: 'app-mypetmanagement',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, ModalModule, NgxSpinnerModule],
  templateUrl: './mypetmanagement.component.html',
  styleUrl: './mypetmanagement.component.scss'
})
export class MypetmanagementComponent {
  my_pet_details: any = []
  my_pet_status: any = false
  mypetpage: number = 1;
  mypettotal: number = 0;
  itemperpage: any = 4

  helppet_data: any = []
  helppetcurrentpage: number = 1;
  //add report
  map!: L.Map;
  marker!: L.Marker;
  selectedFile!: File;
  petreportdetails: any = {
    lastsightlocation: {
      lat: 12.9716, lng: 77.5946
    }
  }
  selectedpetdata: any = {}
  constructor(private commonService: CommonService, private spinner: NgxSpinnerService, private changedetectorRef: ChangeDetectorRef) { }
  ngOnInit(): void {
    this.updateItemsPerPage(window.innerWidth);
    this.getmypetdata()
  }
  ngAfterViewInit() {
    this.getcurrentlocation()
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
  getmypetdata() {
    this.commonService.getRequest('users/get_my_pet_reports').then((mypetres: any) => {

      this.my_pet_details = mypetres.data
      this.mypettotal = mypetres.data.length
    }).catch((_mypetreserror: any) => {
      this.my_pet_details = []
      this.mypettotal = 0
    })
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
  getcurrentlocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.petreportdetails.lastsightlocation.lat = position.coords.latitude
        this.petreportdetails.lastsightlocation.lng = position.coords.longitude
        this.initMap();
        document.getElementById('missingPetModal')?.addEventListener('shown.bs.modal', () => {
          setTimeout(() => {
            this.map.invalidateSize();
          }, 200);
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error("User denied the request for Geolocation.");
            break;
          case error.POSITION_UNAVAILABLE:
            console.error("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            console.error("The request to get user location timed out.");
            break;
          default:
            console.error("An unknown error occurred.");
        }
      }
    );

  }


  initMap(): void {
    this.map = L.map('map').setView([this.petreportdetails.lastsightlocation.lat, this.petreportdetails.lastsightlocation.lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    const customIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      shadowSize: [41, 41]
    });
    this.marker = L.marker([this.petreportdetails.lastsightlocation.lat, this.petreportdetails.lastsightlocation.lng], { icon: customIcon, draggable: true }).addTo(this.map);

    this.marker.on('dragend', (event: any) => {
      const position = this.marker.getLatLng();

      this.petreportdetails.lastsightlocation.lat = position.lat;
      this.petreportdetails.lastsightlocation.lng = position.lng;
    });
  }
  updateStatus(updatemodal: any, updatestatusform: NgForm) {
    this.spinner.show()

    this.commonService.postRequest('users/update_pet_status', { petid: this.selectedpetdata._id, reportstatus: this.selectedpetdata.reportupdatestatus }).then((contactpetRes: any) => {
      if (contactpetRes.status) {
        updatemodal.hide()
        this.commonService.alert('Success', contactpetRes.message)
      } else {
        this.commonService.alert('Error', contactpetRes.message)
      }
      updatestatusform.resetForm()
      this.getmypetdata()
      this.selectedpetdata = {};
      this.spinner.hide()
    }).catch((err: any) => {
      this.spinner.hide()
      this.commonService.alert('Error', 'Something went wrong. Please try again later!')
    })
  }
}
