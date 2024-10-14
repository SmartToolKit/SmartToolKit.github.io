import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-regex-tester',
  templateUrl: './regex-tester.component.html',
  styleUrls: ['./regex-tester.component.scss'] // Fixed to plural 'styleUrls'
})
export class RegexTesterComponent {
  regex = '';
  tests: any[] = [];
  constructor(private titleService: Title) {
    this.titleService.setTitle("Smart ToolKit - Regex Tester")
    try {

      const regex = localStorage.getItem("regex-tester-regex");
      if (regex) {
        this.regex = regex; // Set the regex from local storage
      }

      const tests = localStorage.getItem("regex-tester-tests");
      if (tests) {
        this.tests = (JSON.parse(tests) as any[]).filter(p => p.value); // Correct: use JSON.parse to retrieve array
      }
    } catch (error) {

    }

  }
  // Validates the entered regex pattern
  validate(): boolean {
    const regexString = this.regex;
    if (!regexString) {
      return false;
    }

    try {
      const regex = new RegExp(regexString);
      return true;  // If the regex compiles, it's valid
    } catch (e) {
      return false; // Invalid regex syntax
    }
  }

  // Checks if the test input matches the regex
  isValid(item: any): boolean {
    try {
      const regex = new RegExp(this.regex);
      return regex.test(item.value); // Test against user input
    } catch (e) {
      return false; // Handle potential error in regex
    }
  }

  // Adds a new test input
  addTest() {
    this.tests.push({ value: '', isValid: false, class: '' });
  }

  // Updates the validity of each test case
  runTests() {
    this.tests.forEach(test => {
      test.isValid = this.isValid(test); // Check each test input
    });

    localStorage.setItem("regex-tester-regex", this.regex)
    localStorage.setItem("regex-tester-tests", JSON.stringify(this.tests))
  }

  delete(item: any) {
    if (item.value) return

    item.class = "hinge"

    setTimeout(() => {
      this.tests = this.tests.filter(p => p !== item); // Remove the item from the array
    }, 1900);

  }
}
