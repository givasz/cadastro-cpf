import { ApiClient } from './ApiClient.js';
import { RegistrationForm } from './RegistrationForm.js';
import { SearchPanel } from './SearchPanel.js';

const api = new ApiClient();

new RegistrationForm({
  form: document.getElementById('registration-form'),
  alert: document.getElementById('registration-alert'),
  result: document.getElementById('registration-result'),
  api,
}).mount();

new SearchPanel({
  form: document.getElementById('search-form'),
  results: document.getElementById('search-results'),
  itemTemplate: document.getElementById('citizen-item-template'),
  api,
}).mount();
