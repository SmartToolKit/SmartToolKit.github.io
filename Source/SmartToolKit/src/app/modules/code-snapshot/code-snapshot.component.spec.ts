import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeSnapshotComponent } from './code-snapshot.component';

describe('CodeSnapshotComponent', () => {
  let component: CodeSnapshotComponent;
  let fixture: ComponentFixture<CodeSnapshotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeSnapshotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CodeSnapshotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
