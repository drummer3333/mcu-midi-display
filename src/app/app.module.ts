import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { ChannelStripComponent } from './channel-strip/channel-strip.component';
import { LogPipe } from './pipes/log.pipe';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    ChannelStripComponent,
    LogPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
