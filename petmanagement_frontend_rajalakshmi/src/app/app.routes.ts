import { Routes } from '@angular/router';
import { CommonService } from '../services/common/common.service';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('../pages/homepage/homepage.component').then(m => m.HomepageComponent)

    },
    {
        path: 'signup',
        loadComponent: () => import('../pages/signup/signup.component').then(m => m.SignupComponent)

    },
    {
        path: 'signin',
        loadComponent: () => import('../pages/signin/signin.component').then(m => m.SigninComponent)

    },
    {
        path: 'forgot-password',
        loadComponent: () => import('../pages/forgotpassword/forgotpassword.component').then(m => m.ForgotpasswordComponent)
    },
    {
        path: 'reset-password',
        loadComponent: () => import('../pages/resetpassword/resetpassword.component').then(m => m.ResetpasswordComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('../pages/dashboardpage/dashboardpage.component').then(m => m.DashboardpageComponent),
        canActivate: [CommonService]
    }
];
