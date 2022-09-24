import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VuMeterComponent } from './vu-meter.component';

describe('VuMeterComponent', () => {
  let component: VuMeterComponent;
  let fixture: ComponentFixture<VuMeterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VuMeterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VuMeterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
