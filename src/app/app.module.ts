import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NotifierModule } from 'angular-notifier';

import {VoiceComponent} from './voiceComponent/voice.component';
import { HttpClientModule, HTTP_INTERCEPTORS  } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    VoiceComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NotifierModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
