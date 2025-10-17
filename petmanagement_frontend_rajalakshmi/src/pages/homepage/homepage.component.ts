import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ModalModule } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, ModalModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss'
})
export class HomepageComponent {
  carouselImages: string[] = [
    "assets/images/petquotes.jpg",
    "assets/images/petquotesthree.jpg",
    "assets/images/petquotestwo.jpg",
  ];
 

  constructor() { }

  ngOnInit(): void {
  }
 

 



}
