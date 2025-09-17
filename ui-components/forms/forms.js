/**
 * Universal Form Component
 * Pure JavaScript form system with validation, multi-step support, and accessibility
 * Zero dependencies, fully responsive, and customizable
 */

class FormValidator {
  constructor(form, options = {}) {
    this.form = form;
    this.options = {
      validateOnSubmit: true,
      validateOnBlur: true,
      validateOnInput: false,
      showErrors: true,
      scrollToError: true,
      customValidators: {},
      messages: {
        required: 'This field is required',
        email: 'Please enter a valid email address',
        minLength: 'Minimum {min} characters required',
        maxLength: 'Maximum {max} characters allowed',
        pattern: 'Please match the requested format',
        min: 'Value must be at least {min}',
        max: 'Value must be no more than {max}',
        confirm: 'Passwords do not match'
      },
      ...options
    };

    this.validators = {
      required: (value) => value.trim() !== '',
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      minLength: (value, min) => value.length >= min,
      maxLength: (value, max) => value.length <= max,
      min: (value, min) => parseFloat(value) >= min,
      max: (value, max) => parseFloat(value) <= max,
      pattern: (value, pattern) => new RegExp(pattern).test(value),
      confirm: (value, targetField) => {
        const target = this.form.querySelector(`[name="${targetField}"]`);
        return target ? value === target.value : false;
      },
      ...this.options.customValidators
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.setupValidation();
  }

  bindEvents() {
    if (this.options.validateOnSubmit) {
      this.form.addEventListener('submit', (e) => {
        if (!this.validateForm()) {
          e.preventDefault();
        }
      });
    }

    if (this.options.validateOnBlur) {
      this.form.addEventListener('blur', (e) => {
        if (this.isValidatableField(e.target)) {
          this.validateField(e.target);
        }
      }, true);
    }

    if (this.options.validateOnInput) {
      this.form.addEventListener('input', (e) => {
        if (this.isValidatableField(e.target)) {
          this.clearFieldError(e.target);
          setTimeout(() => this.validateField(e.target), 300);
        }
      });
    }

    // Real-time validation for password confirmation
    this.form.addEventListener('input', (e) => {
      if (e.target.dataset.confirm) {
        this.validateField(e.target);
      }
    });
  }

  setupValidation() {
    const fields = this.form.querySelectorAll('[data-validate]');
    fields.forEach(field => {
      const group = field.closest('.form-group');
      if (group && !group.querySelector('.form-error')) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.style.display = 'none';
        group.appendChild(errorDiv);
      }
    });
  }

  isValidatableField(field) {
    return field.matches('input, textarea, select') && field.dataset.validate;
  }

  validateForm() {
    const fields = this.form.querySelectorAll('[data-validate]');
    let isValid = true;
    let firstError = null;

    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
        if (!firstError) {
          firstError = field;
        }
      }
    });

    if (!isValid && firstError && this.options.scrollToError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.focus();
    }

    return isValid;
  }

  validateField(field) {
    const rules = field.dataset.validate.split('|');
    const value = field.value;
    let isValid = true;
    let errorMessage = '';

    for (const rule of rules) {
      const [validatorName, ...params] = rule.split(':');
      const param = params.join(':');

      if (validatorName === 'required' && this.validators.required(value)) {
        continue;
      }

      if (value === '' && validatorName !== 'required') {
        continue;
      }

      if (!this.validators[validatorName]) {
        console.warn(`Validator "${validatorName}" not found`);
        continue;
      }

      let result;
      if (validatorName === 'confirm') {
        result = this.validators[validatorName](value, param);
      } else if (param) {
        result = this.validators[validatorName](value, param);
      } else {
        result = this.validators[validatorName](value);
      }

      if (!result) {
        isValid = false;
        errorMessage = this.getErrorMessage(validatorName, param);
        break;
      }
    }

    if (this.options.showErrors) {
      if (isValid) {
        this.showFieldSuccess(field);
      } else {
        this.showFieldError(field, errorMessage);
      }
    }

    return isValid;
  }

  getErrorMessage(validatorName, param) {
    let message = this.options.messages[validatorName] || 'Invalid input';
    
    if (param && message.includes('{')) {
      const paramName = validatorName === 'minLength' || validatorName === 'maxLength' ? 
        (validatorName === 'minLength' ? 'min' : 'max') : validatorName.replace(/([A-Z])/g, '_$1').toLowerCase();
      message = message.replace(`{${paramName}}`, param);
    }

    return message;
  }

  showFieldError(field, message) {
    const group = field.closest('.form-group');
    const errorDiv = group.querySelector('.form-error');
    
    field.classList.add('error');
    field.classList.remove('success');
    group.classList.add('has-error');
    group.classList.remove('has-success');

    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  showFieldSuccess(field) {
    const group = field.closest('.form-group');
    const errorDiv = group.querySelector('.form-error');
    
    field.classList.add('success');
    field.classList.remove('error');
    group.classList.add('has-success');
    group.classList.remove('has-error');

    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  clearFieldError(field) {
    const group = field.closest('.form-group');
    const errorDiv = group.querySelector('.form-error');
    
    field.classList.remove('error', 'success');
    group.classList.remove('has-error', 'has-success');

    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  addValidator(name, validator) {
    this.validators[name] = validator;
  }

  setMessage(validator, message) {
    this.options.messages[validator] = message;
  }
}

class MultiStepForm {
  constructor(form, options = {}) {
    this.form = form;
    this.options = {
      showProgress: true,
      validateOnNext: true,
      allowPrevious: true,
      submitOnLast: true,
      autoFocus: true,
      ...options
    };

    this.currentStep = 0;
    this.steps = [];
    this.validator = null;

    this.init();
  }

  init() {
    this.setupSteps();
    this.setupValidation();
    this.setupNavigation();
    this.showStep(0);

    if (this.options.showProgress) {
      this.setupProgress();
    }
  }

  setupSteps() {
    this.steps = Array.from(this.form.querySelectorAll('.form-step-content'));
    
    if (this.steps.length === 0) {
      console.warn('No form steps found. Make sure to add .form-step-content elements.');
      return;
    }

    // Hide all steps initially
    this.steps.forEach((step, index) => {
      step.style.display = 'none';
      step.dataset.stepIndex = index;
    });
  }

  setupValidation() {
    if (this.options.validateOnNext) {
      this.validator = new FormValidator(this.form, {
        validateOnSubmit: false,
        validateOnBlur: true
      });
    }
  }

  setupNavigation() {
    // Next buttons
    this.form.addEventListener('click', (e) => {
      if (e.target.matches('.form-next')) {
        e.preventDefault();
        this.nextStep();
      }
    });

    // Previous buttons
    this.form.addEventListener('click', (e) => {
      if (e.target.matches('.form-prev')) {
        e.preventDefault();
        this.previousStep();
      }
    });

    // Step indicators
    this.form.addEventListener('click', (e) => {
      if (e.target.matches('.form-step-circle')) {
        e.preventDefault();
        const stepIndex = parseInt(e.target.closest('.form-step').dataset.step);
        if (!isNaN(stepIndex)) {
          this.goToStep(stepIndex);
        }
      }
    });
  }

  setupProgress() {
    let progressContainer = this.form.querySelector('.form-progress');
    if (!progressContainer) {
      progressContainer = document.createElement('div');
      progressContainer.className = 'form-progress';
      progressContainer.innerHTML = `
        <div class="form-progress-bar">
          <div class="form-progress-fill"></div>
        </div>
        <div class="form-progress-text"></div>
      `;
      this.form.insertBefore(progressContainer, this.form.firstChild);
    }

    this.updateProgress();
  }

  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      return false;
    }

    // Hide current step
    this.steps.forEach(step => step.style.display = 'none');

    // Show target step
    this.steps[stepIndex].style.display = 'block';
    this.currentStep = stepIndex;

    // Update step indicators
    this.updateStepIndicators();

    // Update progress
    if (this.options.showProgress) {
      this.updateProgress();
    }

    // Auto focus first input
    if (this.options.autoFocus) {
      const firstInput = this.steps[stepIndex].querySelector('input, textarea, select');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }

    // Trigger event
    this.form.dispatchEvent(new CustomEvent('stepChange', {
      detail: { 
        currentStep: stepIndex, 
        totalSteps: this.steps.length 
      }
    }));

    return true;
  }

  nextStep() {
    // Validate current step if validation is enabled
    if (this.options.validateOnNext && this.validator) {
      const currentStepElement = this.steps[this.currentStep];
      const fields = currentStepElement.querySelectorAll('[data-validate]');
      let isValid = true;

      fields.forEach(field => {
        if (!this.validator.validateField(field)) {
          isValid = false;
        }
      });

      if (!isValid) {
        return false;
      }
    }

    if (this.currentStep < this.steps.length - 1) {
      return this.showStep(this.currentStep + 1);
    } else if (this.options.submitOnLast) {
      this.form.dispatchEvent(new CustomEvent('submit'));
      return true;
    }

    return false;
  }

  previousStep() {
    if (this.options.allowPrevious && this.currentStep > 0) {
      return this.showStep(this.currentStep - 1);
    }
    return false;
  }

  goToStep(stepIndex) {
    return this.showStep(stepIndex);
  }

  updateStepIndicators() {
    const stepIndicators = this.form.querySelectorAll('.form-step');
    stepIndicators.forEach((indicator, index) => {
      indicator.classList.remove('active', 'completed');
      
      if (index === this.currentStep) {
        indicator.classList.add('active');
      } else if (index < this.currentStep) {
        indicator.classList.add('completed');
      }
    });
  }

  updateProgress() {
    const progressFill = this.form.querySelector('.form-progress-fill');
    const progressText = this.form.querySelector('.form-progress-text');
    
    const percentage = ((this.currentStep + 1) / this.steps.length) * 100;
    
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `Step ${this.currentStep + 1} of ${this.steps.length}`;
    }
  }

  getCurrentStep() {
    return this.currentStep;
  }

  getTotalSteps() {
    return this.steps.length;
  }
}

class FormBuilder {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      theme: 'default',
      layout: 'vertical',
      submitText: 'Submit',
      resetText: 'Reset',
      showReset: false,
      ...options
    };

    this.fields = [];
    this.form = null;
  }

  addField(config) {
    this.fields.push(config);
    return this;
  }

  addSection(title) {
    this.fields.push({ type: 'section', title });
    return this;
  }

  build() {
    this.form = document.createElement('form');
    this.form.className = `form ${this.options.theme} ${this.options.layout}`;

    this.fields.forEach(field => {
      const element = this.createFieldElement(field);
      this.form.appendChild(element);
    });

    this.addActions();
    this.container.appendChild(this.form);

    return this.form;
  }

  createFieldElement(config) {
    if (config.type === 'section') {
      return this.createSection(config);
    }

    const group = document.createElement('div');
    group.className = 'form-group';

    if (config.label) {
      const label = document.createElement('label');
      label.className = 'form-label';
      if (config.required) label.classList.add('required');
      label.textContent = config.label;
      label.setAttribute('for', config.name);
      group.appendChild(label);
    }

    const input = this.createInput(config);
    group.appendChild(input);

    if (config.help) {
      const help = document.createElement('div');
      help.className = 'form-help';
      help.textContent = config.help;
      group.appendChild(help);
    }

    return group;
  }

  createInput(config) {
    let input;

    switch (config.type) {
      case 'textarea':
        input = document.createElement('textarea');
        input.className = 'form-textarea';
        if (config.rows) input.rows = config.rows;
        break;

      case 'select':
        input = document.createElement('select');
        input.className = 'form-select';
        config.options.forEach(option => {
          const opt = document.createElement('option');
          opt.value = option.value;
          opt.textContent = option.label;
          if (option.selected) opt.selected = true;
          input.appendChild(opt);
        });
        break;

      case 'checkbox':
        const checkboxGroup = document.createElement('div');
        checkboxGroup.className = 'form-checkbox-group';
        config.options.forEach(option => {
          const checkbox = document.createElement('div');
          checkbox.className = 'form-checkbox';
          checkbox.innerHTML = `
            <input type="checkbox" name="${config.name}" value="${option.value}" id="${config.name}_${option.value}">
            <label for="${config.name}_${option.value}">${option.label}</label>
          `;
          checkboxGroup.appendChild(checkbox);
        });
        return checkboxGroup;

      case 'radio':
        const radioGroup = document.createElement('div');
        radioGroup.className = 'form-radio-group';
        config.options.forEach(option => {
          const radio = document.createElement('div');
          radio.className = 'form-radio';
          radio.innerHTML = `
            <input type="radio" name="${config.name}" value="${option.value}" id="${config.name}_${option.value}">
            <label for="${config.name}_${option.value}">${option.label}</label>
          `;
          radioGroup.appendChild(radio);
        });
        return radioGroup;

      default:
        input = document.createElement('input');
        input.type = config.type || 'text';
        input.className = 'form-input';
    }

    // Common attributes
    if (config.name) input.name = config.name;
    if (config.id) input.id = config.id;
    if (config.placeholder) input.placeholder = config.placeholder;
    if (config.required) input.required = true;
    if (config.value) input.value = config.value;
    if (config.validation) input.dataset.validate = config.validation;

    return input;
  }

  createSection(config) {
    const section = document.createElement('div');
    section.className = 'form-section';
    
    const title = document.createElement('h3');
    title.className = 'form-section-title';
    title.textContent = config.title;
    section.appendChild(title);

    return section;
  }

  addActions() {
    const actions = document.createElement('div');
    actions.className = 'form-actions';

    if (this.options.showReset) {
      const resetBtn = document.createElement('button');
      resetBtn.type = 'reset';
      resetBtn.className = 'form-btn outline';
      resetBtn.textContent = this.options.resetText;
      actions.appendChild(resetBtn);
    }

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'form-btn primary';
    submitBtn.textContent = this.options.submitText;
    actions.appendChild(submitBtn);

    this.form.appendChild(actions);
  }
}

// Auto-initialize forms with data attributes
document.addEventListener('DOMContentLoaded', () => {
  // Initialize validators
  document.querySelectorAll('form[data-validate]').forEach(form => {
    const config = JSON.parse(form.dataset.validate || '{}');
    new FormValidator(form, config);
  });

  // Initialize multi-step forms
  document.querySelectorAll('form[data-multistep]').forEach(form => {
    const config = JSON.parse(form.dataset.multistep || '{}');
    new MultiStepForm(form, config);
  });
});

// Export classes
window.FormValidator = FormValidator;
window.MultiStepForm = MultiStepForm;
window.FormBuilder = FormBuilder;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FormValidator, MultiStepForm, FormBuilder };
}