import api from './api';

class AdminService {
  async getAllUsers() {
    return api.get('/api/admin/users');
  }

  async getStats() {
    return api.get('/api/admin/stats');
  }

  async getReports(type, format = 'json') {
    if (format === 'csv') {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/admin/reports?type=${type}&format=csv`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate report' }));
        throw new Error(error.error || 'Failed to generate report');
      }
      
      return await response.text();
    }
    
    return api.get(`/api/admin/reports?type=${type}&format=${format}`);
  }

  async deleteUser(userId) {
    return api.delete(`/api/admin/users/${userId}`);
  }

  async updateUser(userId, data) {
    return api.put(`/api/admin/users/${userId}`, data);
  }

  async createUser(data) {
    return api.post('/api/admin/users', data);
  }

  async getAllPatients() {
    return api.get('/api/admin/patients');
  }

  async getAllDoctors() {
    return api.get('/api/admin/doctors');
  }

  async getAllPharmacists() {
    return api.get('/api/admin/pharmacists');
  }

  async getAllSuppliers() {
    return api.get('/api/admin/suppliers');
  }

  async testSimple() {
    return api.get('/api/admin/test-simple');
  }
}

export default new AdminService();