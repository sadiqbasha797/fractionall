import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Get the token from local storage
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Clone the request and add the authorization header if token exists
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }
  
  // If no token, just pass the original request
  return next(req);
};
