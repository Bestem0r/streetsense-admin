import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';


@Component({
  selector: 'app-main-menu',
  imports: [MatButtonModule],
  templateUrl: './main-menu.component.html',
  styleUrl: './main-menu.component.scss'
})
export class MainMenuComponent {
  constructor(private router: Router) { }



  navigateTo(page: string) {
    console.log('Navigate to ' + page);
    this.router.navigate([page]);
  }

}
