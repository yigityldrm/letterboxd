// axios.js

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/',
  withCredentials: true, // Include cookies with requests
});

export default apiClient;