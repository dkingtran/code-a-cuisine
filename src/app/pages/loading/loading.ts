import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [],
  templateUrl: './loading.html',
  styleUrl: './loading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingComponent implements OnInit {
  constructor(private router: Router) { }

  ngOnInit() {
    // Simulate API call duration
    setTimeout(() => {
      this.router.navigate(['/results']);
    }, 3000); // 3 seconds
  }
}
