import { FormGroup } from "@angular/forms";
export class ValidationService {
  private static readonly emailRegexOne = "[a-z0-9!#$%&'*+/=?^_`{|}~-]";
  private static readonly emailRegexTwo = "[a-z0-9](?:[a-z0-9-]*[a-z0-9])";
  private static readonly emailRegex = new RegExp(
    `${ValidationService.emailRegexOne}+(?:\\.${ValidationService.emailRegexOne}+)*@(?:${ValidationService.emailRegexTwo}?\\.)+${ValidationService.emailRegexTwo}?`
  );

  static emailValidator(control) {
    // RFC 2822 compliant regex
    if (control.value && control.value.match(ValidationService.emailRegex)) {
      return null;
    } else {
      return { invalidEmailAddress: true };
    }
  }

  static confirmPassword(form: FormGroup, field) {
    let fieldChanges = false;
    return function innerFunction(control) {
      if (!fieldChanges) {
        form.get(field).valueChanges.subscribe(() => {
          control.updateValueAndValidity();
        });
        fieldChanges = true;
      }
      if (control.value === form.get(field).value) {
        return null;
      } else {
        return { not_matching: true };
      }
    };
  }

  static passwordValidator(control) {
    // {6,100}           - Assert password is between 6 and 100 characters
    // (?=.*[0-9])       - Assert a string has at least one number
    if (
      control.value &&
      control.value.match(/^(?=.*\d)[a-zA-Z0-9!@#$%^&*]{6,100}$/)
    ) {
      return null;
    } else {
      return { invalidPassword: true };
    }
  }
}
