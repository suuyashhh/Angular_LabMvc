import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-logindairy',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './logindairy.component.html',
  styleUrls: ['./logindairy.component.css']
})
export class LogindairyComponent {

}
