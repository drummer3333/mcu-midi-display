import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelStripComponent } from './channel-strip.component';

describe('ChannelStripComponent', () => {
  let component: ChannelStripComponent;
  let fixture: ComponentFixture<ChannelStripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChannelStripComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelStripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
