import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommonService implements CanActivate {
  loginstatus: any = new BehaviorSubject(false)
  constructor(private router: Router, private toastrService: ToastrService, private httpClient: HttpClient) { }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    let loggedin: any = sessionStorage?.getItem('loginstatus') == 'true' && sessionStorage?.getItem('key')
    if (loggedin) {
      return true; 
    } else {
      this.router.navigate(['/signin']); 
      return false;
    }
  }
  redirectTo(path: any) {
    this.router.navigateByUrl(path)
  }
  alert(status: any, alertmsg: any) {
    this.toastrService.clear()
    switch (status) {
      case 'success':
      case 'Success':
        this.toastrService.success(alertmsg, 'Success', { timeOut: 5000 })
        break;
      case 'error':
      case 'Error':
        this.toastrService.error(alertmsg, 'Error', { timeOut: 5000 })
        break;
      default:
        this.toastrService.info(alertmsg, 'Info', { timeOut: 5000 })
    }
  }
  handleError(error: HttpErrorResponse) {
    let errorMessage = "Unknown error!";
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => errorMessage);
  }
  private extractData(res: any) {
    let body: any = res;
    if (!body.status && body.statusCode == 700) {
      sessionStorage.clear();
      window.location.assign("/");
    } else {
      return body || {};
    }
  }
  requestcondition: any = { url: '' }

  public postRequest(url: any, requestData: any) {
    return new Promise((resolve, _reject) => {
      let bearertoken: any = sessionStorage.getItem('key') ? sessionStorage.getItem('key') : ''
      if (this.requestcondition.url == url) {
        resolve({ status: false, message: 'Your request is already in process' })
      } else {
        this.requestcondition.token = bearertoken
        this.requestcondition.url = url
        const headers = new HttpHeaders()
          .set("cache-control", "no-cache")
          .set("content-type", "application/json")
          .set("authorization", 'Bearer ' + bearertoken)
        this.httpClient
          .post(environment.apiUrl + url, requestData, { headers: headers })
          .pipe(map(this.extractData), catchError(this.handleError)).subscribe((res: any) => {
            this.requestcondition.url = ''
            if (res.logoutstatus) {
              sessionStorage.clear()
              this.alert('Error', 'Your login session is expired. Kindly re login to continue')
              this.redirectTo('/signin')
            } else {
              resolve(res)

            }
          })

      }
    })
  }
  public postFileRequest(url: any, requestData: any) {
    return new Promise((resolve, _reject) => {
      let bearertoken: any = sessionStorage.getItem('key') ? sessionStorage.getItem('key') : ''
      const headers = new HttpHeaders()
        .set("cache-control", "no-cache")
        .set("authorization", 'Bearer ' + bearertoken)
      return this.httpClient
        .post<any>(environment.apiUrl + url, requestData, { headers: headers })
        .pipe(map(this.extractData), catchError(this.handleError)).subscribe((res: any) => {
          if (res.logoutstatus) {
            sessionStorage.clear()
            this.alert('Error', 'Your login session is expired. Kindly re login to continue')
            this.redirectTo('/signin')
          } else {
            resolve(res)

          }
        })
    })
  }
  public getRequest(url: any) {
    return new Promise((resolve, _reject) => {
      let bearertoken: any = sessionStorage.getItem('key') ? sessionStorage.getItem('key') : ''
      const headers = new HttpHeaders()
        .set("cache-control", "no-cache")
        .set("content-type", "application/json")
        .set("authorization", 'Bearer ' + bearertoken)
      return this.httpClient
        .get(environment.apiUrl + url, { headers: headers })
        .pipe(map(this.extractData), catchError(this.handleError)).subscribe((res: any) => {
          if (res.logoutstatus) {
            sessionStorage.clear()
            this.alert('Error', 'Your login session is expired. Kindly re login to continue')
            this.redirectTo('/signin')
          } else {
            resolve(res)

          }
        })
    })
  }


}
